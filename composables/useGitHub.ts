// composables/useGitHub.ts
// Accès à l'API GitHub via le serveur Nuxt (le token reste côté serveur)

import type { GitflowData, GitCommit, GitBranch } from '~/types'

export const useGitHub = () => {
  // Récupère automatiquement l'utilisateur connecté pour son token
  const authStore = useAuthStore()

  /**
   * Récupère les données gitflow d'un repo via notre API server-side
   * Utilise le token GitHub de l'utilisateur connecté s'il existe (5000 req/h)
   * Sinon, requêtes anonymes (60 req/h, repos publics uniquement)
   */
  async function getGitflow(repoUrl: string): Promise<GitflowData> {
    const { owner, repo } = parseRepoUrl(repoUrl)

    // Passer l'userId pour que le serveur récupère son token
    const query: Record<string, string> = { owner, repo }
    if (authStore.user?.id) {
      query.userId = authStore.user.id
    }

    const data = await $fetch<GitflowData>(`/api/github/gitflow`, { query })
    return data
  }

  /**
   * Récupère les infos de base d'un repo
   * Utilise le token GitHub de l'utilisateur connecté s'il existe
   */
  async function getRepoInfo(repoUrl: string) {
    const { owner, repo } = parseRepoUrl(repoUrl)

    const query: Record<string, string> = { owner, repo }
    if (authStore.user?.id) {
      query.userId = authStore.user.id
    }

    return await $fetch(`/api/github/repo`, { query })
  }

  /**
   * Devine l'URL de production Vercel d'un repo élève.
   * Candidats : champ "Website" du repo GitHub, puis https://<repo>.vercel.app.
   * Retourne le premier candidat qui répond réellement, sinon null.
   */
  async function detectDeployUrl(repoUrl: string): Promise<string | null> {
    const { repo } = parseRepoUrl(repoUrl)
    const candidates: string[] = []

    try {
      const info = await getRepoInfo(repoUrl) as { homepage: string | null }
      if (info.homepage) candidates.push(info.homepage)
    } catch {
      // Repo inaccessible : on tente quand même la convention Vercel
    }
    candidates.push(`https://${repo.toLowerCase()}.vercel.app`)

    for (const url of [...new Set(candidates)]) {
      const res = await $fetch<{ live: boolean }>('/api/check-live', { query: { url } })
        .catch(() => ({ live: false }))
      if (res.live) return url
    }
    return null
  }

  return { getGitflow, getRepoInfo, detectDeployUrl }
}

// ----------------------------------------------------------
// Helper — parse URL repo GitHub
// ex: https://github.com/divtec-cejef/m294-projet-vuetify-YuriAyato144
//  → { owner: 'divtec-cejef', repo: 'm294-projet-vuetify-YuriAyato144' }
// ----------------------------------------------------------
export function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/)
  if (!match) throw new Error(`URL GitHub invalide: ${url}`)
  return { owner: match[1], repo: match[2] }
}
