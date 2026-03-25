// server/api/github/verify-token.post.ts
// Vérifie un token GitHub chiffré en le déchiffrant côté serveur

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { userId } = body as { userId: string }

  if (!userId) {
    throw createError({ statusCode: 400, message: 'userId requis' })
  }

  // Client Supabase avec service key pour accéder aux fonctions de déchiffrement
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string
  )

  try {
    // Appeler la fonction RPC pour obtenir le token déchiffré
    const { data: token, error } = await supabase.rpc('get_decrypted_github_token', {
      user_id: userId
    })

    if (error) {
      console.error('Erreur RPC:', error)
      throw createError({ statusCode: 500, message: 'Erreur lors de la récupération du token' })
    }

    if (!token) {
      return { valid: false, message: 'Aucun token configuré' }
    }

    // Vérifier le token auprès de GitHub
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (response.ok) {
      // Récupérer les scopes depuis les headers
      const scopesHeader = response.headers.get('X-OAuth-Scopes')
      const scopes = scopesHeader ? scopesHeader.split(', ').filter(Boolean) : []

      return { valid: true, scopes }
    } else {
      return { valid: false, message: 'Token invalide ou expiré' }
    }

  } catch (err: any) {
    console.error('Erreur vérification token:', err)
    throw createError({ statusCode: 500, message: err.message ?? 'Erreur de vérification' })
  }
})
