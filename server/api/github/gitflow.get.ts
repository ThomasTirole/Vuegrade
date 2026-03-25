// server/api/github/gitflow.get.ts
// Route serveur : récupère branches + commits d'un repo GitHub
// Utilise le token GitHub de l'utilisateur connecté (chiffré en BDD)

import type { GitflowData, GitCommit, GitBranch } from '~/types'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const { owner, repo, userId } = query as { owner: string; repo: string; userId?: string }

  if (!owner || !repo) {
    throw createError({ statusCode: 400, message: 'owner et repo sont requis' })
  }

  // Récupérer le token GitHub de l'utilisateur depuis la BDD
  let githubToken: string | null = null

  if (userId) {
    try {
      const supabase = createClient(
        config.public.supabaseUrl as string,
        config.supabaseServiceKey as string
      )

      const { data: token, error } = await supabase.rpc('get_decrypted_github_token', {
        user_id: userId
      })

      if (!error && token) {
        githubToken = token
      }
    } catch (err) {
      // Silencieux : on continue sans token
      console.warn('Impossible de récupérer le token GitHub:', err)
    }
  }

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // Utiliser le token de l'utilisateur s'il existe
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`

  try {
    // 1. Récupère les branches
    const branchesRaw = await $fetch<any[]>(`${baseUrl}/branches?per_page=30`, { headers })

    // 2. Récupère les commits de chaque branche (max 50 par branche)
    const commitsByBranch = await Promise.all(
      branchesRaw.map(async (branch) => {
        const commits = await $fetch<any[]>(
          `${baseUrl}/commits?sha=${branch.name}&per_page=50`,
          { headers }
        )
        return { branchName: branch.name, commits }
      })
    )

    // 3. Récupère le repo pour la branche par défaut
    const repoInfo = await $fetch<any>(baseUrl, { headers })
    const defaultBranch = repoInfo.default_branch ?? 'main'

    // 4. Déduplique les commits et construit la map branche
    const commitMap = new Map<string, GitCommit>()
    const commitBranchMap: Record<string, string[]> = {}

    for (const { branchName, commits } of commitsByBranch) {
      for (const c of commits) {
        if (!commitMap.has(c.sha)) {
          commitMap.set(c.sha, {
            sha: c.sha,
            shortSha: c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0], // première ligne seulement
            author: c.commit.author?.name ?? c.author?.login ?? 'Unknown',
            authorAvatar: c.author?.avatar_url,
            date: c.commit.author?.date ?? '',
            branch: branchName,
            parents: c.parents?.map((p: any) => p.sha) ?? [],
          })
        }
        if (!commitBranchMap[c.sha]) commitBranchMap[c.sha] = []
        if (!commitBranchMap[c.sha].includes(branchName)) {
          commitBranchMap[c.sha].push(branchName)
        }
      }
    }

    // 5. Trie les commits par date décroissante
    const allCommits = Array.from(commitMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // 6. Construit les objets branches
    const branches: GitBranch[] = branchesRaw.map((b) => ({
      name: b.name,
      lastCommitSha: b.commit.sha,
      lastCommitDate: commitMap.get(b.commit.sha)?.date ?? '',
      isDefault: b.name === defaultBranch,
    }))

    // Branche par défaut en premier
    branches.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))

    const gitflow: GitflowData = {
      branches,
      commits: allCommits,
      commitBranchMap,
      totalCommits: allCommits.length,
      lastActivity: allCommits[0]?.date ?? '',
    }

    return gitflow

  } catch (err: any) {
    // Gestion explicite des erreurs GitHub API
    if (err.status === 404) {
      throw createError({ statusCode: 404, message: `Repo ${owner}/${repo} introuvable` })
    }
    if (err.status === 403) {
      throw createError({ statusCode: 403, message: 'Rate limit GitHub atteint ou token invalide' })
    }
    throw createError({ statusCode: 500, message: err.message ?? 'Erreur GitHub API' })
  }
})
