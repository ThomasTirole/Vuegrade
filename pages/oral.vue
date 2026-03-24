<script setup lang="ts">
import type { Student } from '~/types'

const studentsStore = useStudentsStore()
const { students, loading } = storeToRefs(studentsStore)
const db = useDB()

// Settings pour les pauses
const pauseInterval = ref(4) // Pause tous les X élèves (0 = désactivé)
const pausePositions = ref<number[]>([]) // Positions manuelles

onMounted(async () => {
  studentsStore.fetchAll()

  // Charger les settings de pause
  const settings = await db.settings.getAll()
  pauseInterval.value = parseInt(settings.pause_interval || '4', 10)
  try {
    pausePositions.value = JSON.parse(settings.pause_positions || '[]')
  } catch {
    pausePositions.value = []
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
  pausePositions.value.forEach(pos => {
    if (pos > 0 && pos < sortedStudents.value.length) {
      positions.add(pos)
    }
  })

  return Array.from(positions).sort((a, b) => a - b)
})

// Vérifier si une pause doit être affichée après l'élève à l'index donné
function hasPauseAfter(index: number): boolean {
  return allPausePositions.value.includes(index + 1)
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

            <!-- Pause marker après cet élève si configuré -->
            <div v-if="hasPauseAfter(idx)" class="pause-marker">
              <UIcon name="i-heroicons-pause" />
              <span class="mono">Pause 15' — délibération</span>
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
