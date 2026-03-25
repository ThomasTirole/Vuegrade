// ============================================================
// PLUGIN AUTH — Restauration de session au chargement
// ============================================================

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Restaurer la session depuis localStorage
  await authStore.restoreSession()
})
