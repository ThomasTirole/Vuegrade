<!-- ============================================================
     PAGE PROFILE — Profil utilisateur (token GitHub pour teachers)
     ============================================================ -->
<script setup lang="ts">
const authStore = useAuthStore()
const db = useDB()
const toast = useToast()

// Rediriger si pas connecté
if (!authStore.isAuthenticated) {
  navigateTo('/login')
}

const user = computed(() => authStore.user)
const isTeacher = computed(() => authStore.isTeacher)

// Formulaire token GitHub
const githubToken = ref('')
const showToken = ref(false)
const savingToken = ref(false)
const tokenSaved = ref(false)

// Vérification du token
const verifyingToken = ref(false)
const tokenValid = ref<boolean | null>(null)
const tokenScopes = ref<string[]>([])

onMounted(() => {
  // Si un token existe, afficher des étoiles
  if (user.value?.githubTokenEncrypted) {
    githubToken.value = '••••••••••••••••••••••••••••••••••••••••'
    tokenSaved.value = true
  }
})

async function saveToken() {
  if (!githubToken.value.trim() || githubToken.value.includes('••••')) {
    toast.add({ title: 'Veuillez saisir un token valide', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  savingToken.value = true
  try {
    await db.users.update(user.value!.id, {
      githubTokenEncrypted: githubToken.value.trim()
    })

    // Mettre à jour le user dans le store
    authStore.user!.githubTokenEncrypted = githubToken.value.trim()

    tokenSaved.value = true
    githubToken.value = '••••••••••••••••••••••••••••••••••••••••'
    showToken.value = false

    toast.add({ title: 'Token GitHub enregistré', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur lors de l\'enregistrement', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    savingToken.value = false
  }
}

async function verifyToken() {
  const token = githubToken.value.includes('••••')
    ? user.value?.githubTokenEncrypted
    : githubToken.value.trim()

  if (!token) {
    toast.add({ title: 'Aucun token à vérifier', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  verifyingToken.value = true
  tokenValid.value = null

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (response.ok) {
      tokenValid.value = true
      // Récupérer les scopes depuis les headers
      const scopes = response.headers.get('X-OAuth-Scopes')
      tokenScopes.value = scopes ? scopes.split(', ') : []
      toast.add({ title: 'Token valide', color: 'green', icon: 'i-heroicons-check-circle' })
    } else {
      tokenValid.value = false
      tokenScopes.value = []
      toast.add({ title: 'Token invalide', color: 'red', icon: 'i-heroicons-x-circle' })
    }
  } catch (err) {
    console.error(err)
    tokenValid.value = false
    toast.add({ title: 'Erreur de vérification', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    verifyingToken.value = false
  }
}

function clearToken() {
  githubToken.value = ''
  tokenSaved.value = false
  tokenValid.value = null
  tokenScopes.value = []
  showToken.value = false
}

function editToken() {
  githubToken.value = ''
  tokenSaved.value = false
  showToken.value = true
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Mon profil</h1>
      <p class="page-subtitle mono">Paramètres personnels</p>
    </header>

    <div class="profile-grid">
      <!-- Informations utilisateur -->
      <section class="profile-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-user" />
          Informations
        </h2>

        <div class="info-list">
          <div class="info-item">
            <span class="info-label">Nom</span>
            <span class="info-value">{{ user?.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value mono">{{ user?.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Rôle</span>
            <span class="info-value">
              <span class="role-badge" :class="`role-badge--${user?.role}`">
                {{ user?.role === 'teacher' ? 'Enseignant' : 'Expert' }}
              </span>
            </span>
          </div>
        </div>
      </section>

      <!-- Token GitHub (teachers uniquement) -->
      <section v-if="isTeacher" class="profile-section">
        <h2 class="section-title">
          <UIcon name="i-simple-icons-github" />
          Token GitHub
        </h2>
        <p class="section-desc">
          Le token GitHub permet d'accéder aux repos des élèves et de visualiser leur gitflow.
          <a href="https://github.com/settings/tokens" target="_blank" class="link">
            Créer un token <UIcon name="i-heroicons-arrow-top-right-on-square" />
          </a>
        </p>

        <div class="token-form">
          <UFormGroup label="Personal Access Token">
            <div class="token-input-group">
              <UInput
                v-model="githubToken"
                :type="showToken ? 'text' : 'password'"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                icon="i-heroicons-key"
                :disabled="tokenSaved"
                class="token-input"
              />
              <UButton
                v-if="!tokenSaved"
                :icon="showToken ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                variant="ghost"
                color="gray"
                @click="showToken = !showToken"
              />
            </div>
          </UFormGroup>

          <!-- Actions -->
          <div class="token-actions">
            <template v-if="tokenSaved">
              <UButton
                variant="outline"
                icon="i-heroicons-pencil"
                @click="editToken"
              >
                Modifier
              </UButton>
              <UButton
                :loading="verifyingToken"
                variant="soft"
                icon="i-heroicons-shield-check"
                @click="verifyToken"
              >
                Vérifier
              </UButton>
            </template>
            <template v-else>
              <UButton
                :loading="savingToken"
                icon="i-heroicons-check"
                @click="saveToken"
                :disabled="!githubToken.trim()"
              >
                Enregistrer
              </UButton>
            </template>
          </div>

          <!-- Statut du token -->
          <div v-if="tokenValid !== null" class="token-status" :class="{ 'token-status--valid': tokenValid, 'token-status--invalid': !tokenValid }">
            <UIcon :name="tokenValid ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" />
            <span v-if="tokenValid">Token valide</span>
            <span v-else>Token invalide ou expiré</span>
          </div>

          <!-- Scopes -->
          <div v-if="tokenScopes.length > 0" class="token-scopes">
            <span class="scopes-label">Permissions :</span>
            <span v-for="scope in tokenScopes" :key="scope" class="scope-badge mono">
              {{ scope }}
            </span>
          </div>
        </div>

        <!-- Info scopes requis -->
        <div class="token-hint">
          <UIcon name="i-heroicons-information-circle" />
          <span>Scopes requis : <code>repo</code> (lecture des repos privés)</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem 2.5rem;
  max-width: 700px;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin: 0;
}

.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-section {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
}

.section-desc {
  font-size: 0.85rem;
  color: var(--c-text-soft);
  margin: 0 0 1rem;
  line-height: 1.5;
}

.link {
  color: var(--c-nuxt);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.link:hover {
  text-decoration: underline;
}

/* Info list */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--c-border-soft);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.85rem;
  color: var(--c-text-muted);
}

.info-value {
  font-size: 0.9rem;
  font-weight: 500;
}

.role-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge--teacher {
  background: color-mix(in srgb, var(--c-nuxt) 15%, transparent);
  color: var(--c-nuxt);
}

.role-badge--expert {
  background: color-mix(in srgb, var(--c-info) 15%, transparent);
  color: var(--c-info);
}

/* Token form */
.token-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.token-input-group {
  display: flex;
  gap: 0.5rem;
}

.token-input {
  flex: 1;
}

.token-actions {
  display: flex;
  gap: 0.5rem;
}

.token-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.token-status--valid {
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  color: var(--c-nuxt);
}

.token-status--invalid {
  background: color-mix(in srgb, var(--c-error) 10%, transparent);
  color: var(--c-error);
}

.token-scopes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.scopes-label {
  font-size: 0.8rem;
  color: var(--c-text-muted);
}

.scope-badge {
  padding: 0.15rem 0.5rem;
  background: var(--c-bg-hover);
  border: 1px solid var(--c-border);
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--c-text-soft);
}

.token-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--c-bg);
  border: 1px solid var(--c-border-soft);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin-top: 0.5rem;
}

.token-hint code {
  background: var(--c-bg-hover);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  color: var(--c-nuxt);
}

.mono {
  font-family: var(--font-mono);
}
</style>
