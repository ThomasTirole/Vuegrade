<script setup lang="ts">
import type { Student } from '~/types'

interface ManualPause {
  position: number
  duration: number
}

const studentsStore = useStudentsStore()
const { students, loading } = storeToRefs(studentsStore)
const db = useDB()

// Settings pour les pauses
const pauseInterval = ref(4) // Pause tous les X élèves (0 = désactivé)
const pauseDuration = ref(15) // Durée par défaut des pauses auto en minutes
const manualPauses = ref<ManualPause[]>([]) // Pauses manuelles avec durée individuelle

// Menu d'ajout de pause
const showPauseMenu = ref<number | null>(null) // Position où afficher le menu
const durationOptions = [5, 10, 15]

onMounted(async () => {
  studentsStore.fetchAll()

  // Charger les settings de pause
  const settings = await db.settings.getAll()
  pauseInterval.value = parseInt(settings.pause_interval || '4', 10)
  pauseDuration.value = parseInt(settings.pause_duration || '15', 10)
  try {
    const saved = JSON.parse(settings.pause_positions || '[]')
    // Migration : ancien format (number[]) vers nouveau format (ManualPause[])
    if (saved.length > 0 && typeof saved[0] === 'number') {
      manualPauses.value = saved.map((pos: number) => ({ position: pos, duration: pauseDuration.value }))
    } else {
      manualPauses.value = saved
    }
  } catch {
    manualPauses.value = []
  }
})

// Trier par ordre de passage
const sortedStudents = computed(() =>
  [...students.value].sort((a, b) => {
    if (a.passageOrder == null) return 1
    if (b.passageOrder == null) return -1
    return a.passageOrder - b.passageOrder
  })
)

// Calculer les positions de pause (auto + manuelles, sans doublons)
const allPausePositions = computed(() => {
  const positions = new Set<number>()

  // Pauses automatiques (après chaque X élèves)
  if (pauseInterval.value > 0) {
    const total = sortedStudents.value.length
    for (let i = pauseInterval.value; i < total; i += pauseInterval.value) {
      positions.add(i)
    }
  }

  // Pauses manuelles
  manualPauses.value.forEach(p => {
    if (p.position > 0 && p.position < sortedStudents.value.length) {
      positions.add(p.position)
    }
  })

  return Array.from(positions).sort((a, b) => a - b)
})

// Vérifier si une pause doit être affichée après l'élève à l'index donné
function hasPauseAfter(index: number): boolean {
  return allPausePositions.value.includes(index + 1)
}

// Récupérer la pause manuelle à une position donnée
function getManualPause(position: number): ManualPause | undefined {
  return manualPauses.value.find(p => p.position === position)
}

// Vérifier si une pause manuelle existe à cette position
function isManualPause(position: number): boolean {
  return manualPauses.value.some(p => p.position === position)
}

// Obtenir la durée d'une pause (manuelle ou auto)
function getPauseDuration(position: number): number {
  const manual = getManualPause(position)
  return manual ? manual.duration : pauseDuration.value
}

// Ouvrir le menu d'ajout de pause
function openPauseMenu(index: number) {
  showPauseMenu.value = index
}

// Fermer le menu
function closePauseMenu() {
  showPauseMenu.value = null
}

// Ajouter une pause manuelle avec durée
async function addPauseWithDuration(index: number, duration: number) {
  const position = index + 1
  if (!isManualPause(position)) {
    manualPauses.value.push({ position, duration })
    manualPauses.value.sort((a, b) => a.position - b.position)
    await db.settings.set('pause_positions', JSON.stringify(manualPauses.value))
  }
  closePauseMenu()
}

// Modifier la durée d'une pause manuelle
async function updatePauseDuration(position: number, duration: number) {
  const pause = getManualPause(position)
  if (pause) {
    pause.duration = duration
    await db.settings.set('pause_positions', JSON.stringify(manualPauses.value))
  }
}

// Supprimer une pause manuelle
async function removePause(position: number) {
  manualPauses.value = manualPauses.value.filter(p => p.position !== position)
  await db.settings.set('pause_positions', JSON.stringify(manualPauses.value))
}

const currentStudent = ref<string | null>(null)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Passage oral</h1>
      <p class="page-subtitle mono">Planning du jour — Module 294</p>
    </header>

    <div class="oral-layout">
      <!-- Schedule sidebar -->
      <aside class="schedule-list">
        <h3 class="schedule-title">
          <UIcon name="i-heroicons-clock" />
          Ordre de passage
        </h3>

        <div v-if="loading" class="loading-state">
          <UIcon name="i-heroicons-arrow-path" class="spin" />
        </div>

        <div v-else class="schedule-items">
          <template v-for="(student, idx) in sortedStudents" :key="student.id">
            <div class="schedule-item-wrapper">
              <div
                class="schedule-item"
                :class="{ 'schedule-item--active': currentStudent === student.id }"
                @click="currentStudent = student.id"
              >
                <span class="passage-num mono">{{ idx + 1 }}</span>
                <div class="passage-info">
                  <span class="passage-name">{{ student.name }}</span>
                  <span class="passage-time mono" v-if="student.passageTime">{{ student.passageTime }}</span>
                </div>
                <NuxtLink
                  :to="`/students/${student.id}`"
                  class="go-btn"
                  @click.stop
                  title="Ouvrir la fiche"
                >
                  <UIcon name="i-heroicons-arrow-right" />
                </NuxtLink>
              </div>

              <!-- Bouton ajouter pause (visible au hover si pas déjà de pause) -->
              <div
                v-if="!hasPauseAfter(idx) && idx < sortedStudents.length - 1"
                class="add-pause-zone"
              >
                <button
                  class="add-pause-btn"
                  @click="openPauseMenu(idx)"
                  title="Ajouter une pause ici"
                >
                  <UIcon name="i-heroicons-plus" />
                </button>
                <!-- Menu de sélection durée -->
                <div v-if="showPauseMenu === idx" class="pause-menu" @mouseleave="closePauseMenu">
                  <button
                    v-for="d in durationOptions"
                    :key="d"
                    class="pause-menu-item"
                    @click="addPauseWithDuration(idx, d)"
                  >
                    {{ d }}'
                  </button>
                </div>
              </div>
            </div>

            <!-- Pause marker après cet élève si configuré -->
            <div v-if="hasPauseAfter(idx)" class="pause-marker">
              <UIcon name="i-heroicons-pause" />
              <!-- Durée cliquable pour les pauses manuelles -->
              <div v-if="isManualPause(idx + 1)" class="pause-duration-picker">
                <button
                  v-for="d in durationOptions"
                  :key="d"
                  class="duration-chip"
                  :class="{ 'duration-chip--active': getPauseDuration(idx + 1) === d }"
                  @click="updatePauseDuration(idx + 1, d)"
                >
                  {{ d }}'
                </button>
              </div>
              <span v-else class="mono">{{ getPauseDuration(idx + 1) }}'</span>
              <span class="pause-label-text">— délibération</span>
              <button
                v-if="isManualPause(idx + 1)"
                class="remove-pause-btn"
                @click="removePause(idx + 1)"
                title="Supprimer cette pause"
              >
                <UIcon name="i-heroicons-x-mark" />
              </button>
            </div>
          </template>
        </div>
      </aside>

      <!-- Active student panel -->
      <main class="active-panel">
        <div v-if="!currentStudent" class="select-prompt">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="prompt-icon" />
          <p>Sélectionnez un élève pour démarrer sa session</p>
        </div>

        <template v-else>
          <!-- Embedded student oral view -->
          <div class="active-header">
            <div class="active-student-info">
              <h2 class="active-name">
                {{ students.find(s => s.id === currentStudent)?.name }}
              </h2>
              <span class="active-project mono">
                {{ students.find(s => s.id === currentStudent)?.apiName }}
              </span>
            </div>
            <div class="active-actions">
              <UButton
                :to="`/students/${currentStudent}`"
                icon="i-heroicons-arrow-top-right-on-square"
                variant="outline"
                size="sm"
              >
                Fiche complète
              </UButton>
            </div>
          </div>

          <OralPanel :student-id="currentStudent" />
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 2rem 2.5rem; height: 100vh; display: flex; flex-direction: column; }
.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 0.25rem; }
.page-subtitle { font-family: var(--font-mono); font-size: 0.8rem; color: var(--c-text-muted); margin: 0; }

.oral-layout {
  display: flex; gap: 1.5rem;
  flex: 1; min-height: 0; overflow: hidden;
}

/* Schedule sidebar */
.schedule-list {
  width: 240px; flex-shrink: 0;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  display: flex; flex-direction: column;
  overflow: hidden;
}

.schedule-title {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 0.85rem; font-weight: 600;
  border-bottom: 1px solid var(--c-border-soft);
  margin: 0; color: var(--c-text-soft);
}

.schedule-items {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column;
}

.schedule-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--c-border-soft);
  cursor: pointer; transition: background 0.12s;
}
.schedule-item:hover { background: var(--c-bg-hover); }
.schedule-item--active {
  background: color-mix(in srgb, var(--c-nuxt) 8%, transparent);
  border-left: 2px solid var(--c-nuxt);
}

.passage-num {
  width: 20px; height: 20px; border-radius: 6px;
  background: var(--c-bg); border: 1px solid var(--c-border);
  color: var(--c-text-muted); font-size: 0.68rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.passage-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.passage-name { font-size: 0.82rem; font-weight: 500; }
.passage-time { font-size: 0.68rem; color: var(--c-text-muted); }

.go-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 6px;
  color: var(--c-text-muted); text-decoration: none;
  transition: all 0.12s; font-size: 0.8rem;
}
.go-btn:hover { background: var(--c-bg-hover); color: var(--c-nuxt); }

.schedule-item-wrapper {
  position: relative;
}

.add-pause-zone {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.add-pause-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  color: var(--c-text-muted);
  font-size: 0.65rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}

.schedule-item-wrapper:hover .add-pause-btn {
  opacity: 1;
}

.add-pause-btn:hover {
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
  border-color: var(--c-warn);
  color: var(--c-warn);
}

.pause-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4px;
  display: flex;
  gap: 2px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  padding: 3px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.pause-menu-item {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--c-text-soft);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.12s;
}

.pause-menu-item:hover {
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
  color: var(--c-warn);
}

.pause-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  color: var(--c-warn);
  font-size: 0.7rem;
  background: color-mix(in srgb, var(--c-warn) 8%, transparent);
  border-top: 1px dashed color-mix(in srgb, var(--c-warn) 30%, transparent);
  border-bottom: 1px dashed color-mix(in srgb, var(--c-warn) 30%, transparent);
  position: relative;
}

.remove-pause-btn {
  position: absolute;
  right: 8px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--c-warn);
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
}

.pause-marker:hover .remove-pause-btn {
  opacity: 1;
}

.remove-pause-btn:hover {
  background: color-mix(in srgb, var(--c-warn) 20%, transparent);
}

.pause-duration-picker {
  display: flex;
  gap: 2px;
}

.duration-chip {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--c-warn);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.12s;
  opacity: 0.5;
}

.duration-chip:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
}

.duration-chip--active {
  opacity: 1;
  background: color-mix(in srgb, var(--c-warn) 20%, transparent);
  border-color: var(--c-warn);
}

.pause-label-text {
  font-family: var(--font-mono);
}

/* Active panel */
.active-panel {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1.5rem;
}

.select-prompt {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem; color: var(--c-text-muted);
  background: var(--c-bg-card); border: 1px dashed var(--c-border);
  border-radius: 12px; padding: 4rem;
}
.prompt-icon { font-size: 2.5rem; opacity: 0.3; }

.active-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 1rem; border-bottom: 1px solid var(--c-border);
}
.active-student-info { display: flex; flex-direction: column; gap: 0.2rem; }
.active-name { font-size: 1.25rem; font-weight: 700; margin: 0; }
.active-project { font-size: 0.75rem; color: var(--c-text-muted); }

.loading-state { display: flex; justify-content: center; padding: 2rem; color: var(--c-text-muted); }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
