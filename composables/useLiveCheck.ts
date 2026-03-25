// composables/useLiveCheck.ts
// Vérifie si les sites déployés des élèves sont en ligne avec cache

interface LiveStatus {
  live: boolean
  checking: boolean
  checkedAt: string | null
  error?: string
}

// Cache global (partagé entre tous les composants)
const liveCache = reactive(new Map<string, LiveStatus>())

// Durée du cache : 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export const useLiveCheck = () => {
  /**
   * Vérifie si une URL est en ligne
   * Utilise le cache si disponible et récent
   */
  async function checkLive(url: string): Promise<boolean> {
    if (!url) return false

    // Vérifier le cache
    const cached = liveCache.get(url)
    if (cached && cached.checkedAt) {
      const age = Date.now() - new Date(cached.checkedAt).getTime()
      if (age < CACHE_DURATION && !cached.checking) {
        return cached.live
      }
    }

    // Marquer comme "checking"
    liveCache.set(url, {
      live: cached?.live ?? false,
      checking: true,
      checkedAt: cached?.checkedAt ?? null
    })

    try {
      const result = await $fetch<{
        url: string
        live: boolean
        status?: number
        error?: string
        checkedAt: string
      }>('/api/check-live', {
        query: { url }
      })

      liveCache.set(url, {
        live: result.live,
        checking: false,
        checkedAt: result.checkedAt,
        error: result.error
      })

      return result.live

    } catch (err) {
      liveCache.set(url, {
        live: false,
        checking: false,
        checkedAt: new Date().toISOString(),
        error: 'fetch_error'
      })
      return false
    }
  }

  /**
   * Récupère le statut actuel depuis le cache (sans refetch)
   */
  function getStatus(url: string): LiveStatus {
    return liveCache.get(url) ?? {
      live: false,
      checking: false,
      checkedAt: null
    }
  }

  /**
   * Vérifie plusieurs URLs en parallèle
   */
  async function checkMultiple(urls: string[]): Promise<void> {
    const uniqueUrls = [...new Set(urls.filter(Boolean))]
    await Promise.all(uniqueUrls.map(checkLive))
  }

  /**
   * Force le rafraîchissement d'une URL (ignore le cache)
   */
  async function forceRefresh(url: string): Promise<boolean> {
    liveCache.delete(url)
    return checkLive(url)
  }

  /**
   * Vide tout le cache
   */
  function clearCache(): void {
    liveCache.clear()
  }

  return {
    checkLive,
    getStatus,
    checkMultiple,
    forceRefresh,
    clearCache,
    cache: liveCache
  }
}
