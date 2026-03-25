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

  return { getGitflow, getRepoInfo }
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
