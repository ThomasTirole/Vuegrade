// composables/useGitHub.ts
// Accès à l'API GitHub via le serveur Nuxt (le token reste côté serveur)

import type { GitflowData, GitCommit, GitBranch } from '~/types'

export const useGitHub = () => {

  /**
   * Récupère les données gitflow d'un repo via notre API server-side
   * (le token GitHub ne sort jamais côté client)
   */
  async function getGitflow(repoUrl: string): Promise<GitflowData> {
    const { owner, repo } = parseRepoUrl(repoUrl)
    const data = await $fetch<GitflowData>(`/api/github/gitflow`, {
      query: { owner, repo }
    })
    return data
  }

  /**
   * Récupère les infos de base d'un repo
   */
  async function getRepoInfo(repoUrl: string) {
    const { owner, repo } = parseRepoUrl(repoUrl)
    return await $fetch(`/api/github/repo`, {
      query: { owner, repo }
    })
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
