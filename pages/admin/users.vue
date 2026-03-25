<!-- ============================================================
     PAGE ADMIN USERS — Validation des comptes en attente
     ============================================================ -->
<script setup lang="ts">
import type { User } from '~/types'

const authStore = useAuthStore()
const db = useDB()
const toast = useToast()

// Liste des admins autorisés
const ADMIN_EMAILS = ['thomas.tirole@divtec.ch']

const isAdmin = computed(() =>
  authStore.user?.email && ADMIN_EMAILS.includes(authStore.user.email)
)

// Rediriger si pas admin
if (!isAdmin.value) {
  navigateTo('/')
}

// Liste des utilisateurs
const users = ref<User[]>([])
const loading = ref(true)
const processingId = ref<string | null>(null)

// Filtres
const statusFilter = ref<'all' | 'pending' | 'active' | 'rejected'>('pending')

const filteredUsers = computed(() => {
  if (statusFilter.value === 'all') return users.value
  return users.value.filter(u => u.status === statusFilter.value)
})

const pendingCount = computed(() => users.value.filter(u => u.status === 'pending').length)

async function loadUsers() {
  loading.value = true
  try {
    users.value = await db.users.getAll()
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur de chargement', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    loading.value = false
  }
}

async function approveUser(user: User) {
  processingId.value = user.id
  try {
    await db.users.update(user.id, { status: 'active' })
    user.status = 'active'
    toast.add({ title: `${user.name} approuvé`, color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    processingId.value = null
  }
}

async function rejectUser(user: User) {
  processingId.value = user.id
  try {
    await db.users.update(user.id, { status: 'rejected' })
    user.status = 'rejected'
    toast.add({ title: `${user.name} refusé`, color: 'orange', icon: 'i-heroicons-x-circle' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    processingId.value = null
  }
}

async function deleteUser(user: User) {
  if (!confirm(`Supprimer définitivement ${user.name} ?`)) return

  processingId.value = user.id
  try {
    await db.users.delete(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    toast.add({ title: `${user.name} supprimé`, color: 'gray', icon: 'i-heroicons-trash' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    processingId.value = null
  }
}

function getStatusBadge(status: User['status']) {
  switch (status) {
    case 'pending': return { color: 'orange', label: 'En attente', icon: 'i-heroicons-clock' }
    case 'active': return { color: 'green', label: 'Actif', icon: 'i-heroicons-check-circle' }
    case 'rejected': return { color: 'red', label: 'Refusé', icon: 'i-heroicons-x-circle' }
    default: return { color: 'gray', label: status, icon: 'i-heroicons-question-mark-circle' }
  }
}

function getRoleBadge(role: User['role']) {
  switch (role) {
    case 'teacher': return { color: 'primary', label: 'Enseignant', icon: 'i-heroicons-academic-cap' }
    case 'expert': return { color: 'blue', label: 'Expert', icon: 'i-heroicons-user' }
    default: return { color: 'gray', label: role, icon: 'i-heroicons-user' }
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="page-title">
            <UIcon name="i-heroicons-users" class="title-icon" />
            Gestion des utilisateurs
          </h1>
          <p class="page-subtitle mono">Validation des comptes</p>
        </div>
        <div v-if="pendingCount > 0" class="pending-badge">
          <span class="pending-count">{{ pendingCount }}</span>
          <span>en attente</span>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters">
        <UButtonGroup size="sm">
          <UButton
            :variant="statusFilter === 'pending' ? 'solid' : 'ghost'"
            color="orange"
            @click="statusFilter = 'pending'"
          >
            En attente
          </UButton>
          <UButton
            :variant="statusFilter === 'active' ? 'solid' : 'ghost'"
            color="green"
            @click="statusFilter = 'active'"
          >
            Actifs
          </UButton>
          <UButton
            :variant="statusFilter === 'rejected' ? 'solid' : 'ghost'"
            color="red"
            @click="statusFilter = 'rejected'"
          >
            Refusés
          </UButton>
          <UButton
            :variant="statusFilter === 'all' ? 'solid' : 'ghost'"
            color="gray"
            @click="statusFilter = 'all'"
          >
            Tous
          </UButton>
        </UButtonGroup>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
      <span>Chargement...</span>
    </div>

    <!-- Liste des utilisateurs -->
    <div v-else-if="filteredUsers.length > 0" class="users-list">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
        :class="`user-card--${user.status}`"
      >
        <div class="user-info">
          <div class="user-avatar">
            <UIcon :name="getRoleBadge(user.role).icon" />
          </div>
          <div class="user-details">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-email mono">{{ user.email }}</span>
          </div>
        </div>

        <div class="user-badges">
          <span class="badge" :class="`badge--${user.role}`">
            {{ getRoleBadge(user.role).label }}
          </span>
          <span class="badge" :class="`badge--${user.status}`">
            <UIcon :name="getStatusBadge(user.status).icon" />
            {{ getStatusBadge(user.status).label }}
          </span>
        </div>

        <div class="user-actions">
          <template v-if="user.status === 'pending'">
            <UButton
              icon="i-heroicons-check"
              color="green"
              variant="soft"
              size="sm"
              :loading="processingId === user.id"
              @click="approveUser(user)"
            >
              Approuver
            </UButton>
            <UButton
              icon="i-heroicons-x-mark"
              color="orange"
              variant="soft"
              size="sm"
              :loading="processingId === user.id"
              @click="rejectUser(user)"
            >
              Refuser
            </UButton>
          </template>
          <template v-else-if="user.status === 'rejected'">
            <UButton
              icon="i-heroicons-check"
              color="green"
              variant="ghost"
              size="sm"
              :loading="processingId === user.id"
              @click="approveUser(user)"
            >
              Réactiver
            </UButton>
          </template>
          <template v-else-if="user.status === 'active' && user.id !== authStore.user?.id">
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="sm"
              :loading="processingId === user.id"
              @click="rejectUser(user)"
            >
              Désactiver
            </UButton>
          </template>

          <!-- Supprimer (sauf soi-même) -->
          <UButton
            v-if="user.id !== authStore.user?.id"
            icon="i-heroicons-trash"
            color="red"
            variant="ghost"
            size="sm"
            :loading="processingId === user.id"
            @click="deleteUser(user)"
          />
        </div>

        <div class="user-date mono">
          {{ new Date(user.createdAt).toLocaleDateString('fr-CH') }}
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <UIcon name="i-heroicons-user-group" class="empty-icon" />
      <p v-if="statusFilter === 'pending'">Aucun compte en attente de validation</p>
      <p v-else>Aucun utilisateur trouvé</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem 2.5rem;
  max-width: 900px;
}

.page-header {
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 0 0 0.25rem;
}

.title-icon {
  color: var(--c-nuxt);
}

.page-subtitle {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin: 0;
}

.pending-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-warn) 30%, transparent);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--c-warn);
}

.pending-count {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 1.25rem;
}

.filters {
  margin-bottom: 1rem;
}

/* Users list */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  transition: border-color 0.2s;
}

.user-card--pending {
  border-left: 3px solid var(--c-warn);
}

.user-card--active {
  border-left: 3px solid var(--c-nuxt);
}

.user-card--rejected {
  border-left: 3px solid var(--c-error);
  opacity: 0.7;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--c-bg-hover);
  border: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-muted);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-email {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.user-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
}

.badge--teacher {
  background: color-mix(in srgb, var(--c-nuxt) 15%, transparent);
  color: var(--c-nuxt);
}

.badge--expert {
  background: color-mix(in srgb, var(--c-info) 15%, transparent);
  color: var(--c-info);
}

.badge--pending {
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
  color: var(--c-warn);
}

.badge--active {
  background: color-mix(in srgb, var(--c-nuxt) 15%, transparent);
  color: var(--c-nuxt);
}

.badge--rejected {
  background: color-mix(in srgb, var(--c-error) 15%, transparent);
  color: var(--c-error);
}

.user-actions {
  display: flex;
  gap: 0.35rem;
}

.user-date {
  font-size: 0.7rem;
  color: var(--c-text-muted);
  min-width: 80px;
  text-align: right;
}

/* States */
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--c-text-muted);
  padding: 3rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.spin { animation: spin 1s linear infinite; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--c-text-muted);
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.mono {
  font-family: var(--font-mono);
}
</style>
