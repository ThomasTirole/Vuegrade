<script setup lang="ts">
const route = useRoute()
const db = useDB()
const { getGitflow } = useGitHub()

const studentId = route.params.id as string

const student = ref<any>(null)
const loading = ref(true)
const activeTab = ref('project')

const gitflow = ref<any>(null)
const gitflowLoading = ref(false)
const gitflowError = ref<string | null>(null)

onMounted(async () => {
  try {
    student.value = await db.students.getById(studentId)
  } finally {
    loading.value = false
  }
})

async function loadGitflow() {
  if (gitflow.value || !student.value?.repoUrl) return
  gitflowLoading.value = true
  gitflowError.value = null
  try {
    gitflow.value = await getGitflow(student.value.repoUrl)
  } catch (e: any) {
    gitflowError.value = e.message
  } finally {
    gitflowLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'gitflow') loadGitflow()
})

const tabs = [
  { key: 'project',   label: 'Projet',      icon: 'i-heroicons-cube' },
  { key: 'questions', label: 'Questions',   icon: 'i-heroicons-document-text' },
  { key: 'oral',      label: 'Oral',        icon: 'i-heroicons-microphone' },
  { key: 'gitflow',   label: 'Gitflow',     icon: 'i-simple-icons-git' },
]

const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()

async function deleteStudent() {
  const confirmed = await confirm({
    title: 'Supprimer cet élève ?',
    message: `Cette action supprimera définitivement "${student.value.name}" ainsi que toutes ses questions et notes associées.`,
    confirmLabel: 'Supprimer',
    cancelLabel: 'Annuler',
    confirmColor: 'red',
    icon: 'i-heroicons-trash',
  })

  if (!confirmed) return

  await db.students.delete(studentId)
  toast.add({
    title: 'Élève supprimé',
    description: `${student.value.name} a été supprimé avec succès.`,
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
  router.push('/')
}
</script>

<template>
  <div class="page" v-if="!loading && student">
    <!-- Page header -->
    <div class="page-header">
      <NuxtLink to="/" class="back-link">
        <UIcon name="i-heroicons-arrow-left" />
        Dashboard
      </NuxtLink>
      <div class="student-hero">
        <div class="hero-avatar">
          {{ student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) }}
        </div>
        <div>
          <h1 class="hero-name">{{ student.name }}</h1>
          <div class="hero-meta">
            <span class="mono muted">{{ student.githubUsername }}</span>
            <span v-if="student.passageTime" class="badge-time mono">
              Passage {{ student.passageTime }}
            </span>
          </div>
        </div>
        <div class="hero-actions">
          <UButton
            v-if="student.deployUrl"
            :to="student.deployUrl"
            target="_blank"
            icon="i-heroicons-arrow-top-right-on-square"
            color="primary"
            variant="outline"
            size="sm"
          >
            Voir le site
          </UButton>
          <UButton
            v-if="student.repoUrl"
            :to="student.repoUrl"
            target="_blank"
            icon="i-simple-icons-github"
            variant="ghost"
            size="sm"
          >
            GitHub
          </UButton>
          <UButton
            :to="`/students/${studentId}/edit`"
            icon="i-heroicons-pencil"
            variant="ghost"
            size="sm"
          />
          <UButton
            icon="i-heroicons-trash"
            variant="ghost"
            color="red"
            size="sm"
            @click="deleteStudent"
          />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <UIcon :name="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- PROJECT TAB -->
      <div v-if="activeTab === 'project'" class="tab-panel">
        <div class="info-grid">
          <div class="info-card">
            <span class="info-label">Description du projet</span>
            <p class="info-value">{{ student.projectDescription }}</p>
          </div>
          <div class="info-card">
            <span class="info-label">API utilisée</span>
            <div class="info-value flex-row">
              <UIcon name="i-heroicons-bolt" class="vue-accent" />
              <span class="mono">{{ student.apiName }}</span>
              <a v-if="student.apiUrl" :href="student.apiUrl" target="_blank" class="link-inline">
                <UIcon name="i-heroicons-arrow-top-right-on-square" />
              </a>
            </div>
          </div>
          <div class="info-card" v-if="student.teacherApiKey">
            <span class="info-label">Clé API enseignant</span>
            <code class="info-value mono api-key">{{ student.teacherApiKey }}</code>
          </div>
        </div>
      </div>

      <!-- QUESTIONS TAB -->
      <div v-if="activeTab === 'questions'" class="tab-panel">
        <StudentQuestions :student-id="studentId" />
      </div>

      <!-- ORAL TAB -->
      <div v-if="activeTab === 'oral'" class="tab-panel">
        <OralPanel :student-id="studentId" />
      </div>

      <!-- GITFLOW TAB -->
      <div v-if="activeTab === 'gitflow'" class="tab-panel">
        <div v-if="gitflowLoading" class="loading-state">
          <UIcon name="i-heroicons-arrow-path" class="spin" />
          Chargement du gitflow…
        </div>
        <UAlert v-else-if="gitflowError" color="red" icon="i-heroicons-exclamation-circle" :description="gitflowError" />
        <GitflowViewer v-else-if="gitflow" :data="gitflow" />
        <div v-else class="empty-state">
          <p>Aucune donnée gitflow disponible.</p>
          <UButton @click="loadGitflow" size="sm" variant="outline">Charger</UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="loading-state page">
    <UIcon name="i-heroicons-arrow-path" class="spin" />
    Chargement…
  </div>

  <!-- Not found -->
  <div v-else class="page empty-state">
    <p>Élève introuvable.</p>
    <NuxtLink to="/">← Retour</NuxtLink>
  </div>
</template>

<style scoped>
.page { padding: 2rem 2.5rem; max-width: 1200px; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--c-text-muted);
  font-size: 0.8rem;
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color 0.15s;
  font-family: var(--font-mono);
}
.back-link:hover { color: var(--c-text); }

.student-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.hero-avatar {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--c-nuxt) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-nuxt) 30%, transparent);
  color: var(--c-nuxt);
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 500;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.hero-name {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.2rem;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.muted { color: var(--c-text-muted); font-size: 0.8rem; }

.badge-time {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--c-warn) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-warn) 30%, transparent);
  color: var(--c-warn);
  border-radius: 6px;
}

.hero-actions { margin-left: auto; display: flex; gap: 0.5rem; }

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 2rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--c-text-soft);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: -1px;
  font-family: var(--font-display);
}

.tab-btn:hover { color: var(--c-text); }

.tab-btn--active {
  color: var(--c-nuxt);
  border-bottom-color: var(--c-nuxt);
}

/* Content */
.tab-panel { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } }

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.info-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.info-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--c-text-muted);
}

.info-value { font-size: 0.875rem; color: var(--c-text); margin: 0; }
.flex-row { display: flex; align-items: center; gap: 0.4rem; }
.vue-accent { color: var(--c-vue); }
.link-inline { color: var(--c-text-muted); font-size: 0.75rem; transition: color 0.15s; }
.link-inline:hover { color: var(--c-nuxt); }
.api-key { font-size: 0.75rem; color: var(--c-text-muted); word-break: break-all; }

.loading-state {
  display: flex; align-items: center; gap: 0.75rem;
  color: var(--c-text-muted); padding: 3rem;
  font-family: var(--font-mono); font-size: 0.875rem;
}
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; padding: 4rem 2rem; color: var(--c-text-muted); text-align: center;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
