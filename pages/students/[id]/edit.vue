<!-- pages/students/[id]/edit.vue — Formulaire édition élève -->
<script setup lang="ts">
import { extractRepoName, inferDeployUrl } from '~/types'

const route = useRoute()
const router = useRouter()
const db = useDB()
const studentsStore = useStudentsStore()

const studentId = route.params.id as string

const pageLoading = ref(true)
const submitLoading = ref(false)
const error = ref<string | null>(null)
const notFound = ref(false)

const form = reactive({
  name: '',
  githubUsername: '',
  repoUrl: '',
  deployUrl: '',
  projectDescription: '',
  apiName: '',
  apiUrl: '',
  teacherApiKey: '',
  passageOrder: null as number | null,
  passageTime: '',
})

onMounted(async () => {
  try {
    const student = await db.students.getById(studentId)
    if (!student) {
      notFound.value = true
      return
    }
    // Pré-remplir le formulaire
    form.name = student.name
    form.githubUsername = student.githubUsername
    form.repoUrl = student.repoUrl
    form.deployUrl = student.deployUrl ?? ''
    form.projectDescription = student.projectDescription
    form.apiName = student.apiName
    form.apiUrl = student.apiUrl ?? ''
    form.teacherApiKey = student.teacherApiKey ?? ''
    form.passageOrder = student.passageOrder ?? null
    form.passageTime = student.passageTime ?? ''
  } catch (e: any) {
    error.value = e.message
  } finally {
    pageLoading.value = false
  }
})

// Calcul automatique de l'URL de déploiement
watch(
  () => [form.githubUsername, form.repoUrl],
  ([username, repoUrl]) => {
    if (username && repoUrl) {
      const repoName = extractRepoName(repoUrl as string)
      if (repoName) {
        form.deployUrl = inferDeployUrl(username as string, repoName)
      }
    }
  }
)

const isValid = computed(() => {
  return (
    form.name.trim() &&
    form.githubUsername.trim() &&
    form.repoUrl.trim() &&
    form.projectDescription.trim() &&
    form.apiName.trim()
  )
})

async function handleSubmit() {
  if (!isValid.value) return

  submitLoading.value = true
  error.value = null

  try {
    await studentsStore.updateStudent(studentId, {
      name: form.name.trim(),
      githubUsername: form.githubUsername.trim(),
      repoUrl: form.repoUrl.trim(),
      deployUrl: form.deployUrl.trim() || undefined,
      projectDescription: form.projectDescription.trim(),
      apiName: form.apiName.trim(),
      apiUrl: form.apiUrl.trim() || undefined,
      teacherApiKey: form.teacherApiKey.trim() || undefined,
      passageOrder: form.passageOrder ?? undefined,
      passageTime: form.passageTime.trim() || undefined,
    })
    router.push(`/students/${studentId}`)
  } catch (e: any) {
    error.value = e.message || 'Erreur lors de la mise à jour'
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <!-- Loading -->
  <div v-if="pageLoading" class="loading-state page">
    <UIcon name="i-heroicons-arrow-path" class="spin" />
    Chargement…
  </div>

  <!-- Not found -->
  <div v-else-if="notFound" class="page empty-state">
    <p>Élève introuvable.</p>
    <NuxtLink to="/">← Retour</NuxtLink>
  </div>

  <!-- Formulaire -->
  <div v-else class="page">
    <!-- Header -->
    <div class="page-header">
      <NuxtLink :to="`/students/${studentId}`" class="back-link">
        <UIcon name="i-heroicons-arrow-left" />
        Retour à la fiche
      </NuxtLink>
      <h1 class="page-title">Modifier l'élève</h1>
    </div>

    <form class="form-card" @submit.prevent="handleSubmit">
      <UAlert v-if="error" color="red" icon="i-heroicons-exclamation-circle" :description="error" class="mb-4" />

      <!-- Section identité -->
      <div class="form-section">
        <h2 class="section-title">Identité</h2>
        <div class="form-grid">
          <UFormGroup label="Nom complet" required>
            <UInput v-model="form.name" placeholder="Ex: Bélet Aedan" icon="i-heroicons-user" />
          </UFormGroup>
          <UFormGroup label="Username GitHub" required>
            <UInput v-model="form.githubUsername" placeholder="Ex: YuriAyato144" icon="i-simple-icons-github" />
          </UFormGroup>
        </div>
      </div>

      <!-- Section projet -->
      <div class="form-section">
        <h2 class="section-title">Projet</h2>
        <UFormGroup label="URL du repo GitHub" required>
          <UInput v-model="form.repoUrl" placeholder="https://github.com/org/repo" icon="i-heroicons-link" />
        </UFormGroup>
        <UFormGroup label="URL du site déployé" hint="Calculée automatiquement depuis le repo">
          <UInput v-model="form.deployUrl" placeholder="https://username.github.io/repo/" icon="i-heroicons-globe-alt" />
        </UFormGroup>
        <UFormGroup label="Description du projet" required>
          <UTextarea v-model="form.projectDescription" placeholder="Ex: Affichage des divinités de la mythologie grecque" :rows="3" />
        </UFormGroup>
      </div>

      <!-- Section API -->
      <div class="form-section">
        <h2 class="section-title">API</h2>
        <div class="form-grid">
          <UFormGroup label="Nom de l'API" required>
            <UInput v-model="form.apiName" placeholder="Ex: GreekMyth API" icon="i-heroicons-bolt" />
          </UFormGroup>
          <UFormGroup label="URL documentation API">
            <UInput v-model="form.apiUrl" placeholder="https://api.example.com/docs" icon="i-heroicons-document-text" />
          </UFormGroup>
        </div>
        <UFormGroup label="Clé API enseignant">
          <UInput v-model="form.teacherApiKey" placeholder="Clé fournie pour les tests" icon="i-heroicons-key" />
        </UFormGroup>
      </div>

      <!-- Section oral -->
      <div class="form-section">
        <h2 class="section-title">Passage oral</h2>
        <div class="form-grid">
          <UFormGroup label="Ordre de passage">
            <UInput v-model.number="form.passageOrder" type="number" placeholder="1" icon="i-heroicons-hashtag" />
          </UFormGroup>
          <UFormGroup label="Heure de passage">
            <UInput v-model="form.passageTime" placeholder="08:20" icon="i-heroicons-clock" />
          </UFormGroup>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <UButton :to="`/students/${studentId}`" variant="ghost" color="gray">Annuler</UButton>
        <UButton type="submit" :loading="submitLoading" :disabled="!isValid" icon="i-heroicons-check">
          Enregistrer
        </UButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem 2.5rem;
  max-width: 800px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--c-text-muted);
  font-size: 0.8rem;
  text-decoration: none;
  margin-bottom: 1rem;
  transition: color 0.15s;
  font-family: var(--font-mono);
}
.back-link:hover { color: var(--c-text); }

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 2rem;
}

.form-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}
.form-section:last-of-type { margin-bottom: 1.5rem; }

.section-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--c-nuxt);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--c-border-soft);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--c-border-soft);
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--c-text-muted);
  padding: 3rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--c-text-muted);
  text-align: center;
}

.mb-4 { margin-bottom: 1rem; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
