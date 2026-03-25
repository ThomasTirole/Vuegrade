<!-- ============================================================
     PAGE REGISTER — Inscription utilisateur
     ============================================================ -->
<script setup lang="ts">
definePageMeta({
  layout: false, // Pas de sidebar sur la page d'inscription
})

const authStore = useAuthStore()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'expert' as 'teacher' | 'expert',
})

const isLoading = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)

const roleOptions = [
  { label: 'Expert (notation orale)', value: 'expert' },
  { label: 'Enseignant (gestion complète)', value: 'teacher' },
]

async function handleRegister() {
  // Validations
  if (!form.name.trim()) {
    errorMessage.value = 'Veuillez saisir votre nom'
    return
  }

  if (!form.email.trim()) {
    errorMessage.value = 'Veuillez saisir votre email'
    return
  }

  if (!form.password) {
    errorMessage.value = 'Veuillez saisir un mot de passe'
    return
  }

  if (form.password.length < 4) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 4 caractères'
    return
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  const result = await authStore.register({
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    role: form.role,
  })

  if (result.success) {
    isSuccess.value = true
    toast.add({
      title: 'Inscription réussie',
      description: 'Votre compte est en attente de validation',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } else {
    errorMessage.value = result.error || 'Erreur lors de l\'inscription'
  }

  isLoading.value = false
}
</script>

<template>
  <div class="register-page">
    <div class="register-card">
      <!-- Logo -->
      <div class="register-header">
        <span class="logo-icon">▲</span>
        <h1 class="logo-title">VueGrade</h1>
        <p class="logo-sub">Module 294 — Inscription</p>
      </div>

      <!-- Message de succès -->
      <div v-if="isSuccess" class="success-state">
        <div class="success-icon">
          <UIcon name="i-heroicons-clock" />
        </div>
        <h2>Inscription enregistrée</h2>
        <p>
          Votre compte est <strong>en attente de validation</strong> par un administrateur.
          Vous recevrez un email une fois votre compte activé.
        </p>
        <NuxtLink to="/login" class="back-link">
          <UIcon name="i-heroicons-arrow-left" />
          Retour à la connexion
        </NuxtLink>
      </div>

      <!-- Formulaire -->
      <form v-else class="register-form" @submit.prevent="handleRegister">
        <UFormGroup label="Nom complet">
          <UInput
            v-model="form.name"
            placeholder="Jean Dupont"
            icon="i-heroicons-user"
            size="lg"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UFormGroup label="Email">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="votre@email.ch"
            icon="i-heroicons-envelope"
            size="lg"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UFormGroup label="Rôle">
          <USelectMenu
            v-model="form.role"
            :options="roleOptions"
            value-attribute="value"
            option-attribute="label"
            size="lg"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UFormGroup label="Mot de passe">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="Mot de passe"
            icon="i-heroicons-lock-closed"
            size="lg"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UFormGroup label="Confirmer le mot de passe">
          <UInput
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirmer le mot de passe"
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
          Créer mon compte
        </UButton>

        <!-- Lien connexion -->
        <div class="register-footer">
          <p class="register-info">Déjà un compte ?</p>
          <NuxtLink to="/login" class="login-link">
            Se connecter
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg);
  padding: 1rem;
}

.register-card {
  width: 100%;
  max-width: 420px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 2.5rem;
}

.register-header {
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.register-footer {
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--c-border-soft);
}

.register-info {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin: 0 0 0.5rem;
}

.login-link {
  color: var(--c-nuxt);
  font-weight: 500;
  text-decoration: none;
  font-size: 0.9rem;
}

.login-link:hover {
  text-decoration: underline;
}

/* État de succès */
.success-state {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
  border: 2px solid var(--c-warn);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--c-warn);
}

.success-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--c-text);
}

.success-state p {
  font-size: 0.9rem;
  color: var(--c-text-soft);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--c-nuxt);
  font-weight: 500;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
