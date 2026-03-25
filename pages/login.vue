<!-- ============================================================
     PAGE LOGIN — Connexion utilisateur
     ============================================================ -->
<script setup lang="ts">
definePageMeta({
  layout: false, // Pas de sidebar sur la page de login
})

const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!email.value) {
    errorMessage.value = 'Veuillez saisir votre email'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const success = await authStore.login(email.value, password.value)

  if (success) {
    toast.add({
      title: 'Connexion réussie',
      description: `Bienvenue, ${authStore.user?.name}`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
    navigateTo('/')
  } else {
    errorMessage.value = 'Email non reconnu'
  }

  isLoading.value = false
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-header">
        <span class="logo-icon">▲</span>
        <h1 class="logo-title">VueGrade</h1>
        <p class="logo-sub">Module 294 — Connexion</p>
      </div>

      <!-- Formulaire -->
      <form class="login-form" @submit.prevent="handleLogin">
        <UFormGroup label="Email">
          <UInput
            v-model="email"
            type="email"
            placeholder="votre@email.ch"
            icon="i-heroicons-envelope"
            size="lg"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UFormGroup label="Mot de passe">
          <UInput
            v-model="password"
            type="password"
            placeholder="Mot de passe"
            icon="i-heroicons-lock-closed"
            size="lg"
            :disabled="isLoading"
          />
        </UFormGroup>

        <!-- Message d'erreur -->
        <div v-if="errorMessage" class="error-message">
          <UIcon name="i-heroicons-exclamation-circle" />
          {{ errorMessage }}
        </div>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="isLoading"
          :disabled="isLoading"
        >
          Se connecter
        </UButton>
      </form>

      <!-- Info -->
      <p class="login-info">
        Outil interne pour enseignants et experts M294
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 2.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 2.5rem;
  color: var(--c-nuxt);
  text-shadow: 0 0 24px rgba(0, 220, 130, 0.5);
  display: block;
  margin-bottom: 0.75rem;
}

.logo-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--c-text);
  margin: 0;
  letter-spacing: -0.02em;
}

.logo-sub {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin: 0.25rem 0 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--c-error) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-error) 30%, transparent);
  border-radius: 8px;
  color: var(--c-error);
  font-size: 0.875rem;
}

.login-info {
  text-align: center;
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin-top: 1.5rem;
  margin-bottom: 0;
}
</style>
