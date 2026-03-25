// ============================================================
// MIDDLEWARE AUTH — Protection des routes
// ============================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // Ne pas protéger la page de login
  if (to.path === '/login') {
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
