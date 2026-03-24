<script setup lang="ts">
import type { Expert } from '~/types'

const db = useDB()
const experts = ref<Expert[]>([])
const settings = ref<Record<string, string>>({})
const loading = ref(true)
const saving = ref(false)

// Formulaire settings éditables
const form = reactive({
  projectTemplate: '',
  githubOrg: '',
  pauseInterval: 4,
  pausePositions: [] as number[]
})

// Pour ajouter une position manuelle
const newPausePosition = ref<number | null>(null)

onMounted(async () => {
  try {
    const [expertsData, settingsData] = await Promise.all([
      db.experts.getAll(),
      db.settings.getAll()
    ])
    experts.value = expertsData
    settings.value = settingsData
    form.projectTemplate = settingsData.project_template || ''
    form.githubOrg = settingsData.github_org || ''
    form.pauseInterval = parseInt(settingsData.pause_interval || '4', 10)
    try {
      form.pausePositions = JSON.parse(settingsData.pause_positions || '[]')
    } catch {
      form.pausePositions = []
    }
  } finally {
    loading.value = false
  }
})

const toast = useToast()

async function saveSettings() {
  saving.value = true
  try {
    await Promise.all([
      db.settings.set('project_template', form.projectTemplate),
      db.settings.set('github_org', form.githubOrg),
      db.settings.set('pause_interval', String(form.pauseInterval)),
      db.settings.set('pause_positions', JSON.stringify(form.pausePositions))
    ])
    settings.value.project_template = form.projectTemplate
    settings.value.github_org = form.githubOrg
    settings.value.pause_interval = String(form.pauseInterval)
    settings.value.pause_positions = JSON.stringify(form.pausePositions)
    toast.add({ title: 'Paramètres enregistrés', icon: 'i-heroicons-check-circle', color: 'green' })
  } finally {
    saving.value = false
  }
}

function addPausePosition() {
  if (newPausePosition.value && newPausePosition.value > 0) {
    if (!form.pausePositions.includes(newPausePosition.value)) {
      form.pausePositions.push(newPausePosition.value)
      form.pausePositions.sort((a, b) => a - b)
    }
    newPausePosition.value = null
  }
}

function removePausePosition(pos: number) {
  form.pausePositions = form.pausePositions.filter(p => p !== pos)
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
      <p class="page-subtitle mono">Configuration de VueGrade</p>
    </header>

    <div class="settings-grid">
      <!-- Experts -->
      <section class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-user-group" />
          Experts
        </h2>
        <p class="section-desc">Les experts participent à la notation orale. Leurs initiales sont utilisées dans les grilles de notation.</p>

        <div v-if="loading" class="loading-state">
          <UIcon name="i-heroicons-arrow-path" class="spin" />
        </div>
        <div v-else class="experts-list">
          <div v-for="expert in experts" :key="expert.id" class="expert-row">
            <div class="expert-avatar mono">{{ expert.initials }}</div>
            <div class="expert-info">
              <span class="expert-name">{{ expert.name }}</span>
              <span class="expert-role mono" :class="`role--${expert.role}`">{{ expert.role }}</span>
            </div>
          </div>
        </div>
        <p class="setting-note">
          <UIcon name="i-heroicons-information-circle" />
          Les experts sont configurés directement en base Supabase (table <code class="mono">experts</code>).
        </p>
      </section>

      <!-- Projet config -->
      <section class="settings-section">
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

      <!-- Pauses délibération -->
      <section class="settings-section">
        <h2 class="section-title">
          <UIcon name="i-heroicons-pause" />
          Pauses de délibération
        </h2>
        <p class="section-desc">
          Configurez les pauses de 15 minutes pour la délibération pendant les passages oraux.
        </p>

        <div class="pause-config">
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
              <div v-for="pos in form.pausePositions" :key="pos" class="position-tag">
                <span class="mono">{{ pos }}</span>
                <button class="tag-remove" @click="removePausePosition(pos)">
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
</style>
