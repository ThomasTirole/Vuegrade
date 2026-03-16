// server/api/github/repo.get.ts
// Route serveur : récupère les infos basiques d'un repo GitHub
// Le token GitHub reste ici, côté serveur uniquement

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const { owner, repo } = query as { owner: string; repo: string }

  if (!owner || !repo) {
    throw createError({ statusCode: 400, message: 'owner et repo sont requis' })
  }

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (config.githubToken) {
    headers['Authorization'] = `Bearer ${config.githubToken}`
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
