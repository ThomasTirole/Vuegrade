<script setup lang="ts">
const authStore = useAuthStore()
const db = useDB()
const toast = useToast()

const classOptions = computed(() =>
  authStore.accessibleClasses.map(c => ({
    label: `${c.name} (${c.year})`,
    value: c.id,
  }))
)

const selectedClassId = computed({
  get: () => authStore.selectedClassId,
  set: (val) => {
    if (val) authStore.selectClass(val)
  },
})

function handleLogout() {
  authStore.logout()
}

// --- Création de classe ---
const showCreateClassModal = ref(false)
const creatingClass = ref(false)
const classForm = reactive({
  name: '',
  year: new Date().getFullYear(),
  githubOrg: '',
  projectTemplate: '',
})

function openCreateClass() {
  classForm.name = ''
  classForm.year = new Date().getFullYear()
  classForm.githubOrg = ''
  classForm.projectTemplate = ''
  showCreateClassModal.value = true
}

async function createClass() {
  if (!classForm.name.trim()) {
    toast.add({ title: 'Le nom de la classe est requis', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  creatingClass.value = true
  try {
    const newClass = await db.classes.create({
      teacherId: authStore.user!.id,
      name: classForm.name.trim(),
      year: classForm.year,
      githubOrg: classForm.githubOrg.trim() || undefined,
      projectTemplate: classForm.projectTemplate.trim() || undefined,
      pauseInterval: 4,
      pauseDuration: 15,
      pausePositions: [],
    })

    // Recharger les classes et sélectionner la nouvelle
    await authStore.loadClasses()
    authStore.selectClass(newClass.id)

    toast.add({ title: 'Classe créée', color: 'green', icon: 'i-heroicons-check-circle' })
    showCreateClassModal.value = false
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur lors de la création', color: 'red', icon: 'i-heroicons-x-circle' })
  } finally {
    creatingClass.value = false
  }
}
</script>

<template>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">▲</span>
        <div class="logo-text">
          <span class="logo-main">VueGrade</span>
          <span class="logo-sub">Module 294</span>
        </div>
      </div>

      <!-- Sélecteur de classe -->
      <div v-if="authStore.isAuthenticated" class="class-selector">
        <div class="class-selector-header">
          <span class="nav-label">Classe</span>
          <button
            v-if="authStore.isTeacher"
            class="add-class-btn"
            title="Créer une classe"
            @click="openCreateClass"
          >
            <UIcon name="i-heroicons-plus" />
          </button>
        </div>
        <USelectMenu
          v-model="selectedClassId"
          :options="classOptions"
          value-attribute="value"
          option-attribute="label"
          placeholder="Sélectionner une classe"
          size="sm"
        >
          <template #leading>
            <UIcon name="i-heroicons-academic-cap" class="selector-icon" />
          </template>
        </USelectMenu>
      </div>

      <!-- Modal création de classe -->
      <UModal v-model="showCreateClassModal">
        <UCard>
          <template #header>
            <div class="modal-header">
              <UIcon name="i-heroicons-academic-cap" />
              <h3>Créer une classe</h3>
            </div>
          </template>

          <div class="class-form">
            <UFormGroup label="Nom de la classe" required>
              <UInput
                v-model="classForm.name"
                placeholder="M294-2026"
                icon="i-heroicons-tag"
              />
            </UFormGroup>

            <UFormGroup label="Année">
              <UInput
                v-model.number="classForm.year"
                type="number"
                :min="2020"
                :max="2100"
                icon="i-heroicons-calendar"
              />
            </UFormGroup>

            <UFormGroup label="Organisation GitHub" hint="Optionnel">
              <UInput
                v-model="classForm.githubOrg"
                placeholder="divtec-cejef"
                icon="i-simple-icons-github"
              />
            </UFormGroup>

            <UFormGroup label="Template de projet" hint="Optionnel">
              <UInput
                v-model="classForm.projectTemplate"
                placeholder="m294-projet-vuetify"
                icon="i-heroicons-document-duplicate"
              />
            </UFormGroup>
          </div>

          <template #footer>
            <div class="modal-footer">
              <UButton
                variant="ghost"
                color="gray"
                @click="showCreateClassModal = false"
              >
                Annuler
              </UButton>
              <UButton
                :loading="creatingClass"
                icon="i-heroicons-check"
                @click="createClass"
              >
                Créer
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <nav class="sidebar-nav">
        <span class="nav-label">Navigation</span>

        <NuxtLink to="/" class="nav-item" active-class="nav-item--active" exact>
          <UIcon name="i-heroicons-squares-2x2" />
          <span>Dashboard</span>
        </NuxtLink>

        <NuxtLink to="/students" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-users" />
          <span>Élèves</span>
        </NuxtLink>

        <NuxtLink to="/questions" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-chat-bubble-left-right" />
          <span>Questions</span>
        </NuxtLink>

        <NuxtLink to="/oral" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-microphone" />
          <span>Passage oral</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <NuxtLink to="/settings" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-heroicons-cog-6-tooth" />
          <span>Paramètres</span>
        </NuxtLink>

        <!-- User info -->
        <div v-if="authStore.user" class="user-info">
          <NuxtLink to="/profile" class="user-badge" :class="{ 'user-badge--teacher': authStore.isTeacher }">
            <UIcon :name="authStore.isTeacher ? 'i-heroicons-academic-cap' : 'i-heroicons-user'" />
            <span class="user-name">{{ authStore.user.name }}</span>
          </NuxtLink>
          <button class="logout-btn" title="Se déconnecter" @click="handleLogout">
            <UIcon name="i-heroicons-arrow-right-on-rectangle" />
          </button>
        </div>

        <div class="version-tag">v1.1.0 — M294</div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--c-bg);
}

/* ---- Sidebar ---- */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--c-bg-soft);
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border-soft);
  margin-bottom: 1.5rem;
}

.logo-icon {
  font-size: 1.4rem;
  color: var(--c-nuxt);
  text-shadow: 0 0 16px rgba(0, 220, 130, 0.5);
  line-height: 1;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-main {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--c-text);
  letter-spacing: -0.02em;
}

.logo-sub {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--c-text-muted);
  letter-spacing: 0.05em;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 0.75rem;
}

.nav-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--c-text-muted);
  padding: 0 0.5rem 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  color: var(--c-text-soft);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.nav-item:hover {
  background: var(--c-bg-hover);
  color: var(--c-text);
}

.nav-item--active {
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  color: var(--c-nuxt);
  border-color: color-mix(in srgb, var(--c-nuxt) 25%, transparent);
}

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--c-border-soft);
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--c-text-muted);
  padding: 0.25rem 0.5rem;
  text-align: center;
}

/* ---- Class Selector ---- */
.class-selector {
  padding: 0 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--c-border-soft);
}

.class-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.class-selector .nav-label {
  padding-left: 0.5rem;
}

.add-class-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--c-border);
  color: var(--c-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-class-btn:hover {
  background: var(--c-nuxt);
  border-color: var(--c-nuxt);
  color: var(--c-bg);
}

.selector-icon {
  color: var(--c-nuxt);
}

/* ---- Modal ---- */
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--c-nuxt);
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--c-text);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.class-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ---- User Info ---- */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background: var(--c-bg-hover);
  border-radius: 8px;
}

.user-badge {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--c-text-soft);
  text-decoration: none;
  transition: color 0.15s ease;
}

.user-badge:hover {
  color: var(--c-text);
}

.user-badge--teacher {
  color: var(--c-nuxt);
}

.user-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--c-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  background: var(--c-bg-card);
  color: var(--c-error);
  border-color: var(--c-border);
}

/* ---- Main ---- */
.main-content {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
}
</style>
