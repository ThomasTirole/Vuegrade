// server/api/github/repo.get.ts
// Route serveur : récupère les infos basiques d'un repo GitHub
// Utilise le token GitHub de l'utilisateur connecté (chiffré en BDD)

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
      console.warn('Impossible de récupérer le token GitHub:', err)
    }
  }

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`

  try {
    const repoData = await $fetch<any>(baseUrl, { headers })

    return {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      defaultBranch: repoData.default_branch,
      lastPushAt: repoData.pushed_at,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      htmlUrl: repoData.html_url,
      language: repoData.language,
      visibility: repoData.visibility,
      openIssues: repoData.open_issues_count,
      hasPages: repoData.has_pages,
    }

  } catch (err: any) {
    if (err.status === 404) {
      throw createError({ statusCode: 404, message: `Repo ${owner}/${repo} introuvable` })
    }
    if (err.status === 403) {
      throw createError({ statusCode: 403, message: 'Rate limit GitHub atteint ou token invalide' })
    }
    throw createError({ statusCode: 500, message: err.message ?? 'Erreur GitHub API' })
  }
})
