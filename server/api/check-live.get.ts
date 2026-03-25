// server/api/check-live.get.ts
// Vérifie si un site déployé répond (HEAD request)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { url } = query as { url: string }

  if (!url) {
    throw createError({ statusCode: 400, message: 'url requis' })
  }

  // Valider l'URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    // Autoriser uniquement http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Protocol non autorisé')
    }
  } catch {
    throw createError({ statusCode: 400, message: 'URL invalide' })
  }

  try {
    // HEAD request avec timeout court
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'VueGrade-LiveCheck/1.0'
      }
    })

    clearTimeout(timeout)

    // Considérer comme "live" si status 2xx ou 3xx
    const isLive = response.status >= 200 && response.status < 400

    return {
      url,
      live: isLive,
      status: response.status,
      checkedAt: new Date().toISOString()
    }

  } catch (err: any) {
    // Timeout ou erreur réseau = pas live
    return {
      url,
      live: false,
      error: err.name === 'AbortError' ? 'timeout' : 'network_error',
      checkedAt: new Date().toISOString()
    }
  }
})
