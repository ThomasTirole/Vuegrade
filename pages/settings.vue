<script setup lang="ts">
import type { User, Class } from '~/types'

interface ManualPause {
  position: number
  duration: number
}

const db = useDB()
const toast = useToast()
const authStore = useAuthStore()

// Experts de la classe
const classExperts = ref<User[]>([])
const allExperts = ref<User[]>([])
const loading = ref(true)
const saving = ref(false)

// Permissions
const isTeacher = computed(() => authStore.isTeacher)
const currentClass = computed(() => authStore.selectedClass)

// --- Gestion des experts de la classe ---
const showAddExpertModal = ref(false)
const addingExpert = ref(false)
const selectedExpertId = ref<string | null>(null)

// Experts disponibles (non déjà assignés à la classe)
const availableExperts = computed(() => {
  const assignedIds = new Set(classExperts.value.map(e => e.id))
  return allExperts.value.filter(e => !assignedIds.has(e.id) && e.role === 'expert')
})

async function loadClassExperts() {
  if (!currentClass.value) return
  classExperts.value = await db.classes.getExperts(currentClass.value.id)
}

async function addExpertToClass() {
  if (!selectedExpertId.value || !currentClass.value) return

  addingExpert.value = true
  try {
    await db.classes.addExpert(currentClass.value.id, selectedExpertId.value)
    await loadClassExperts()
    toast.add({ title: 'Expert ajouté à la classe', icon: 'i-heroicons-check-circle', color: 'green' })
    showAddExpertModal.value = false
    selectedExpertId.value = null
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur lors de l\'ajout', icon: 'i-heroicons-x-circle', color: 'red' })
  } finally {
    addingExpert.value = false
  }
}

const confirmRemoveExpert = ref<User | null>(null)

async function removeExpert(expert: User) {
  confirmRemoveExpert.value = expert
}

async function confirmRemoveExpertFromClass() {
  if (!confirmRemoveExpert.value || !currentClass.value) return
  try {
    await db.classes.removeExpert(currentClass.value.id, confirmRemoveExpert.value.id)
    await loadClassExperts()
    toast.add({ title: 'Expert retiré de la classe', icon: 'i-heroicons-check-circle', color: 'green' })
  } catch (err) {
    console.error(err)
    toast.add({ title: 'Erreur lors du retrait', icon: 'i-heroicons-x-circle', color: 'red' })
  } finally {
    confirmRemoveExpert.value = null
  }
}

// Formulaire settings éditables (paramètres de la classe)
const form = reactive({
  projectTemplate: '',
  githubOrg: '',
  pauseInterval: 4,
  pauseDuration: 15,
  manualPauses: [] as ManualPause[]
})

// Options de durée de pause
const durationOptions = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 }
]

// Pour ajouter une position manuelle
const newPausePosition = ref<number | null>(null)

// Charger les données de la classe
watch(() => currentClass.value, async (cls) => {
  if (!cls) return
  loading.value = true
  try {
    // Charger les paramètres de la classe
    form.projectTemplate = cls.projectTemplate || ''
    form.githubOrg = cls.githubOrg || ''
    form.pauseInterval = cls.pauseInterval
    form.pauseDuration = cls.pauseDuration
    form.manualPauses = cls.pausePositions || []

    // Charger les experts de la classe
    await loadClassExperts()

    // Charger tous les experts (pour le modal d'ajout)
    if (isTeacher.value) {
      allExperts.value = (await db.users.getAll()).filter(u => u.role === 'expert')
    }
  } finally {
    loading.value = false
  }
}, { immediate: true })

async function saveSettings() {
  if (!currentClass.value || !isTeacher.value) return

  saving.value = true
  try {
    await db.classes.update(currentClass.value.id, {
      projectTemplate: form.projectTemplate,
      githubOrg: form.githubOrg,
      pauseInterval: form.pauseInterval,
      pauseDuration: form.pauseDuration,
      pausePositions: form.manualPauses
    })

    // Recharger les classes dans le store
    await authStore.loadClasses()

    toast.add({ title: 'Paramètres enregistrés', icon: 'i-heroicons-check-circle', color: 'green' })
  } finally {
    saving.value = false
  }
}

function addPausePosition() {
  if (newPausePosition.value && newPausePosition.value > 0) {
    const exists = form.manualPauses.some(p => p.position === newPausePosition.value)
    if (!exists) {
      form.manualPauses.push({ position: newPausePosition.value, duration: form.pauseDuration })
      form.manualPauses.sort((a, b) => a.position - b.position)
    }
    newPausePosition.value = null
  }
}

function removePausePosition(pause: ManualPause) {
  form.manualPauses = form.manualPauses.filter(p => p.position !== pause.position)
}

function updatePauseDuration(pause: ManualPause, duration: number) {
  pause.duration = duration
}

// Génère un exemple d'URL pour prévisualisation
const exampleRepoUrl = computed(() => {
  if (!form.githubOrg || !form.projectTemplate) return ''
  return `https://github.com/${form.githubOrg}/${form.projectTemplate}-{username}`
})

const exampleDeployUrl = computed(() => {
  if (!form.githubOrg || !form.projectTemplate) return ''
  return `https://${form.githubOrg}.github.io/${form.projectTemplate}-{username}`
})

function addPausePosition() {
  if (newPausePosition.value && newPausePosition.value > 0) {
    const exists = form.manualPauses.some(p => p.position === newPausePosition.value)
    if (!exists) {
      form.manualPauses.push({ position: newPausePosition.value, duration: form.pauseDuration })
      form.manualPauses.sort((a, b) => a.position - b.position)
    }
    newPausePosition.value = null
  }
}

function removePausePosition(pause: ManualPause) {
  form.manualPauses = form.manualPauses.filter(p => p.position !== pause.position)
}

function updatePauseDuration(pause: ManualPause, duration: number) {
  pause.duration = duration
}

// Génère un exemple d'URL pour prévisualisation
const exampleRepoUrl = computed(() => {
  if (!form.githubOrg || !form.projectTemplate) return ''
  return `https://github.com/${form.githubOrg}/${form.projectTemplate}-{username}`
})

const exampleDeployUrl = computed(() => {
  if (!form.githubOrg || !form.projectTemplate) return ''
  return `https://${form.githubOrg}.github.io/${form.projectTemplate}-{username}`
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Paramètres</h1>
      <p class="page-subtitle mono">
        {{ currentClass ? `Classe : ${currentClass.name} (${currentClass.year})` : 'Configuration de VueGrade' }}
      </p>
    </header>

    <!-- Pas de classe sélectionnée -->
    <div v-if="!currentClass" class="no-class-state">
      <UIcon name="i-heroicons-academic-cap" class="empty-icon" />
      <p>Sélectionnez une classe dans la barre latérale pour voir ses paramètres.</p>
    </div>

    <div v-else class="settings-grid">
      <!-- Experts de la classe -->
      <section class="settings-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">
              <UIcon name="i-heroicons-user-group" />
              Experts de la classe
            </h2>
            <p class="section-desc">Les experts assignés à cette classe peuvent noter les passages oraux.</p>
          </div>
          <UButton
            v-if="isTeacher"
            icon="i-heroicons-plus"
            size="sm"
            @click="showAddExpertModal = true"
            :disabled="availableExperts.length === 0"
          >
            Ajouter
          </UButton>
        </div>

        <div v-if="loading" class="loading-state">
          <UIcon name="i-heroicons-arrow-path" class="spin" />
        </div>
        <div v-else class="experts-list">
          <div v-for="expert in classExperts" :key="expert.id" class="expert-row">
            <div class="expert-avatar mono">{{ expert.name.split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase() }}</div>
            <div class="expert-info">
              <span class="expert-name">{{ expert.name }}</span>
              <span class="expert-email mono">{{ expert.email }}</span>
            </div>
            <div v-if="isTeacher" class="expert-actions">
              <UButton
                icon="i-heroicons-x-mark"
                size="xs"
                variant="ghost"
                color="red"
                title="Retirer de la classe"
                @click="removeExpert(expert)"
              />
            </div>
          </div>
          <div v-if="classExperts.length === 0" class="empty-state">
            Aucun expert assigné à cette classe
          </div>
        </div>
      </section>

      <!-- Modal ajout expert -->
      <UModal v-model="showAddExpertModal">
        <UCard>
          <template #header>
            <div class="modal-header">
              <h3>Ajouter un expert à la classe</h3>
            </div>
          </template>

          <UFormGroup label="Sélectionner un expert">
            <USelectMenu
              v-model="selectedExpertId"
              :options="availableExperts.map(e => ({ label: e.name, value: e.id }))"
              value-attribute="value"
              option-attribute="label"
              placeholder="Choisir un expert..."
            />
          </UFormGroup>

          <template #footer>
            <div class="modal-footer">
              <UButton
                variant="ghost"
                color="gray"
                @click="showAddExpertModal = false"
              >
                Annuler
              </UButton>
              <UButton
                :loading="addingExpert"
                :disabled="!selectedExpertId"
                icon="i-heroicons-check"
                @click="addExpertToClass"
              >
                Ajouter
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Modal confirmation retrait expert -->
      <UModal :model-value="!!confirmRemoveExpert" @update:model-value="confirmRemoveExpert = null">
        <UCard>
          <template #header>
            <div class="modal-header modal-header--danger">
              <UIcon name="i-heroicons-exclamation-triangle" />
              <h3>Retirer l'expert</h3>
            </div>
          </template>

          <p>
            Voulez-vous vraiment retirer <strong>{{ confirmRemoveExpert?.name }}</strong> de cette classe ?
          </p>
          <p class="warning-text">
            L'expert ne pourra plus noter les passages oraux de cette classe.
          </p>

          <template #footer>
            <div class="modal-footer">
              <UButton
                variant="ghost"
                color="gray"
                @click="confirmRemoveExpert = null"
              >
                Annuler
              </UButton>
              <UButton
                color="red"
                icon="i-heroicons-x-mark"
                @click="confirmRemoveExpertFromClass"
              >
                Retirer
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- Projet config (enseignant uniquement) -->
      <section v-if="isTeacher" class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-simple-icons-github" />
          Configuration projet
        </h2>
        <p class="section-desc">Paramètres pour la génération automatique des URLs des repos élèves.</p>

        <div class="form-grid">
          <UFormGroup label="Organisation GitHub">
            <UInput
              v-model="form.githubOrg"
              placeholder="divtec-cejef"
              icon="i-heroicons-building-office"
            />
          </UFormGroup>
          <UFormGroup label="Template de projet">
            <UInput
              v-model="form.projectTemplate"
              placeholder="m294-projet-vuetify"
              icon="i-heroicons-document-duplicate"
            />
          </UFormGroup>
        </div>

        <div v-if="exampleRepoUrl" class="url-preview">
          <div class="preview-item">
            <span class="preview-label">Repo</span>
            <code class="mono">{{ exampleRepoUrl }}</code>
          </div>
          <div class="preview-item">
            <span class="preview-label">Deploy</span>
            <code class="mono">{{ exampleDeployUrl }}</code>
          </div>
        </div>

        <div class="form-actions">
          <UButton
            @click="saveSettings"
            :loading="saving"
            icon="i-heroicons-check"
            size="sm"
          >
            Enregistrer
          </UButton>
        </div>
      </section>

      <!-- Pauses délibération (enseignant uniquement) -->
      <section v-if="isTeacher" class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-pause" />
          Pauses de délibération
        </h2>
        <p class="section-desc">
          Configurez les pauses de délibération pendant les passages oraux.
        </p>

        <div class="pause-config">
          <!-- Durée des pauses automatiques -->
          <div class="pause-duration">
            <span class="pause-label">Durée des pauses auto :</span>
            <div class="duration-buttons">
              <button
                v-for="opt in durationOptions"
                :key="opt.value"
                class="duration-btn"
                :class="{ 'duration-btn--active': form.pauseDuration === opt.value }"
                @click="form.pauseDuration = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Pause automatique -->
          <div class="pause-auto">
            <span class="pause-label">Pause automatique tous les</span>
            <UInput
              v-model.number="form.pauseInterval"
              type="number"
              :min="0"
              :max="20"
              class="pause-input"
              placeholder="4"
            />
            <span class="pause-label">élèves</span>
            <span class="pause-hint mono">(0 = désactivé)</span>
          </div>

          <!-- Pauses manuelles -->
          <div class="pause-manual">
            <span class="pause-label">Pauses manuelles (après le nème élève) :</span>
            <div class="manual-positions">
              <div v-for="pause in form.manualPauses" :key="pause.position" class="position-tag">
                <span class="mono position-num">{{ pause.position }}</span>
                <div class="position-duration">
                  <button
                    v-for="opt in durationOptions"
                    :key="opt.value"
                    class="mini-duration-btn"
                    :class="{ 'mini-duration-btn--active': pause.duration === opt.value }"
                    @click="updatePauseDuration(pause, opt.value)"
                  >
                    {{ opt.value }}'
                  </button>
                </div>
                <button class="tag-remove" @click="removePausePosition(pause)">
                  <UIcon name="i-heroicons-x-mark" />
                </button>
              </div>
              <div class="add-position">
                <UInput
                  v-model.number="newPausePosition"
                  type="number"
                  :min="1"
                  :max="50"
                  placeholder="N°"
                  class="position-input"
                  @keyup.enter="addPausePosition"
                />
                <UButton
                  icon="i-heroicons-plus"
                  size="xs"
                  variant="soft"
                  @click="addPausePosition"
                  :disabled="!newPausePosition"
                >
                  Ajouter
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <UButton
            @click="saveSettings"
            :loading="saving"
            icon="i-heroicons-check"
            size="sm"
          >
            Enregistrer
          </UButton>
        </div>
      </section>

      <!-- Stack info -->
      <section class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-cube" />
          Stack technique
        </h2>
        <div class="stack-list">
          <div class="stack-item">
            <span class="stack-dot" style="background: #00DC82" />
            <span class="mono">Nuxt 3</span>
            <span class="stack-role">Framework</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #41b883" />
            <span class="mono">Vue 3</span>
            <span class="stack-role">UI</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #3ecf8e" />
            <span class="mono">Supabase</span>
            <span class="stack-role">Base de données</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #3b82f6" />
            <span class="mono">Nuxt UI</span>
            <span class="stack-role">Composants</span>
          </div>
          <div class="stack-item">
            <span class="stack-dot" style="background: #f6821f" />
            <span class="mono">GitHub API</span>
            <span class="stack-role">Gitflow</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem 2.5rem; max-width: 900px; }
.page-header { margin-bottom: 2rem; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
.page-subtitle { font-family: var(--font-mono); font-size: 0.8rem; color: var(--c-text-muted); margin: 0; }

.settings-grid { display: flex; flex-direction: column; gap: 1.5rem; }

.settings-section {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.section-title {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 1rem; font-weight: 600; margin: 0;
}

.section-desc { font-size: 0.85rem; color: var(--c-text-soft); margin: 0; }

/* Experts */
.experts-list { display: flex; flex-direction: column; gap: 0.5rem; }
.expert-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--c-bg); border: 1px solid var(--c-border-soft);
  border-radius: 8px;
}
.expert-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-nuxt) 25%, transparent);
  color: var(--c-nuxt); font-size: 0.7rem; font-weight: 500;
  display: flex; align-items: center; justify-content: center;
}
.expert-info { display: flex; align-items: center; gap: 0.6rem; }
.expert-name { font-size: 0.875rem; font-weight: 500; }
.expert-role {
  font-size: 0.65rem; padding: 1px 6px;
  border-radius: 4px; text-transform: uppercase;
}
.role--teacher {
  background: color-mix(in srgb, var(--c-nuxt) 12%, transparent);
  color: var(--c-nuxt);
}
.role--expert {
  background: color-mix(in srgb, var(--c-info) 12%, transparent);
  color: var(--c-info);
}

.expert-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s;
}

.expert-row:hover .expert-actions {
  opacity: 1;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.85rem;
}

.no-class-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: var(--c-text-muted);
  text-align: center;
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  border-radius: 12px;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.expert-email {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

/* Modal */
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
}

.modal-header--danger {
  color: var(--c-error);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.expert-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.initials-input {
  max-width: 100px;
  text-transform: uppercase;
}

.warning-text {
  font-size: 0.85rem;
  color: var(--c-text-muted);
  margin-top: 0.5rem;
}

/* GitHub */
.config-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.5rem 0.75rem;
  background: var(--c-bg); border: 1px solid var(--c-border-soft);
  border-radius: 8px;
}
.config-key { font-size: 0.78rem; color: var(--c-text-muted); min-width: 140px; }
.config-val { font-size: 0.78rem; color: var(--c-text); }

.setting-note {
  display: flex; align-items: flex-start; gap: 0.4rem;
  font-size: 0.78rem; color: var(--c-text-muted); margin: 0;
  line-height: 1.5;
}

/* Stack */
.stack-list { display: flex; flex-direction: column; gap: 0.4rem; }
.stack-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.4rem 0;
  font-size: 0.85rem;
}
.stack-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.stack-role { color: var(--c-text-muted); font-size: 0.78rem; margin-left: auto; }

.loading-state { display: flex; justify-content: center; padding: 1rem; color: var(--c-text-muted); }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.url-preview {
  background: var(--c-bg);
  border: 1px solid var(--c-border-soft);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.preview-label {
  color: var(--c-text-muted);
  min-width: 50px;
}

.preview-item code {
  color: var(--c-nuxt);
  word-break: break-all;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

/* Pause config */
.pause-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pause-auto {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pause-label {
  font-size: 0.85rem;
  color: var(--c-text-soft);
}

.pause-input {
  width: 70px;
}

.pause-hint {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.pause-manual {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.manual-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.position-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: color-mix(in srgb, var(--c-warn) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-warn) 30%, transparent);
  border-radius: 6px;
  color: var(--c-warn);
  font-size: 0.8rem;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--c-warn);
  cursor: pointer;
  transition: background 0.15s;
}

.tag-remove:hover {
  background: color-mix(in srgb, var(--c-warn) 20%, transparent);
}

.add-position {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.position-input {
  width: 60px;
}

.position-num {
  min-width: 20px;
  text-align: center;
}

.position-duration {
  display: flex;
  gap: 1px;
  margin-left: 4px;
}

.mini-duration-btn {
  padding: 1px 4px;
  border-radius: 3px;
  border: none;
  background: transparent;
  color: var(--c-warn);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  cursor: pointer;
  opacity: 0.4;
  transition: all 0.12s;
}

.mini-duration-btn:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
}

.mini-duration-btn--active {
  opacity: 1;
  background: color-mix(in srgb, var(--c-warn) 25%, transparent);
}

/* Duration buttons */
.pause-duration {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.duration-buttons {
  display: flex;
  gap: 0.35rem;
}

.duration-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text-soft);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.duration-btn:hover {
  border-color: var(--c-nuxt);
  color: var(--c-nuxt);
}

.duration-btn--active {
  background: color-mix(in srgb, var(--c-nuxt) 12%, transparent);
  border-color: var(--c-nuxt);
  color: var(--c-nuxt);
}
</style>
