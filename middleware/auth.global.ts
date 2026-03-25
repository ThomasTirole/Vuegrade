// ============================================================
// MIDDLEWARE AUTH — Protection des routes (client-side only)
// ============================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // Ne pas exécuter côté serveur (localStorage n'existe pas)
  if (import.meta.server) {
    return
  }

  // Ne pas protéger les pages publiques
  if (to.path === '/login' || to.path === '/register') {
    return
  }

  const authStore = useAuthStore()

  // Attendre la restauration de session si en cours
  if (authStore.isLoading) {
    await authStore.restoreSession()
  }

  // Rediriger vers login si non authentifié
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
