<script setup lang="ts">
import { calculateFinalScore, SCORE_LABELS } from '~/types'
import type { Question, OralSession, Expert, OralGrade } from '~/types'

const props = defineProps<{ studentId: string }>()

const db = useDB()

const session = ref<OralSession | null>(null)
const questions = ref<Question[]>([])
const experts = ref<Expert[]>([])
const loading = ref(true)
const saving = ref<string | null>(null) // questionId en cours de sauvegarde

// Quel expert suis-je ? (stocké en localStorage pour persistance de session)
const currentExpertId = ref<string | null>(
  typeof window !== 'undefined' ? localStorage.getItem('vugrade_expert') : null
)

// Ref pour les grades (pour le realtime)
const grades = ref<OralGrade[]>([])

// Ref réactive pour studentId (pour le realtime)
const studentIdRef = toRef(props, 'studentId')

// Synchronisation realtime des notes et sessions
useRealtimeGrades(studentIdRef, session, grades)

onMounted(async () => {
  try {
    const [qs, ex, sess] = await Promise.all([
      // Utilise getAssignedForStudent pour n'avoir que les questions attribuées
      db.questions.getAssignedForStudent(props.studentId),
      db.experts.getAll(),
      db.oral.getSessionByStudent(props.studentId),
    ])
    questions.value = qs
    experts.value = ex
    session.value = sess
    // Initialise les grades depuis la session
    grades.value = sess?.grades ?? []
  } finally {
    loading.value = false
  }
})

// Sélection de l'expert courant
function selectExpert(id: string) {
  currentExpertId.value = id
  if (typeof window !== 'undefined') localStorage.setItem('vugrade_expert', id)
}

// Score actuel pour une question / expert
function getScore(questionId: string, expertId: string): number | null {
  const grade = grades.value.find(
    g => g.questionId === questionId && g.expertId === expertId
  )
  return grade?.score ?? null
}

// Note finale pour une question (moyenne des experts)
function getQuestionFinal(questionId: string): number | null {
  const expertScores = experts.value
    .map(e => getScore(questionId, e.id))
    .filter((s): s is number => s !== null)
  return calculateFinalScore(expertScores)
}

// Score global de l'élève
const globalScore = computed(() => {
  const questionFinals = questions.value
    .map(q => getQuestionFinal(q.id))
    .filter((s): s is number => s !== null)
  return calculateFinalScore(questionFinals)
})

// Crée ou démarre une session
async function startSession() {
  const questionIds = questions.value.map(q => q.id)
  session.value = await db.oral.createSession(props.studentId, questionIds)
  await db.oral.updateSessionStatus(session.value.id, 'in_progress')
  session.value.status = 'in_progress'
}

// Termine la session
async function completeSession() {
  if (!session.value) return
  await db.oral.updateSessionStatus(session.value.id, 'completed')
  session.value.status = 'completed'
  session.value.completedAt = new Date().toISOString()
}

// Rouvre la session (si besoin de modifier)
async function reopenSession() {
  if (!session.value) return
  await db.oral.updateSessionStatus(session.value.id, 'in_progress')
  session.value.status = 'in_progress'
  session.value.completedAt = undefined
}

const isCompleted = computed(() => session.value?.status === 'completed')

// Sauvegarde une note
async function saveScore(questionId: string, score: number) {
  if (!session.value || !currentExpertId.value) return
  saving.value = questionId
  try {
    const newGrade = await db.oral.upsertGrade({
      sessionId: session.value.id,
      studentId: props.studentId,
      questionId,
      expertId: currentExpertId.value,
      score,
    })
    // Mise à jour locale immédiate (le realtime mettra aussi à jour, mais c'est plus réactif)
    const existingIdx = grades.value.findIndex(
      g => g.questionId === questionId && g.expertId === currentExpertId.value
    )
    if (existingIdx !== -1) {
      grades.value[existingIdx] = newGrade
    } else {
      grades.value.push(newGrade)
    }
  } finally {
    saving.value = null
  }
}

const theoreticalQs = computed(() => questions.value.filter(q => q.type === 'theoretical'))
const practicalQs = computed(() => questions.value.filter(q => q.type === 'practical'))

// Génère le ref à afficher (T-X stocké pour théoriques, P-X calculé pour pratiques)
function getDisplayRef(question: Question, index: number): string {
  if (question.type === 'theoretical') {
    return question.ref || `T-${index + 1}`
  }
  return `P-${index + 1}`
}
</script>

<template>
  <div class="oral-panel">

    <!-- Sélection expert -->
    <div class="expert-selector">
      <span class="section-label">Je suis :</span>
      <div class="expert-list">
        <button
          v-for="expert in experts"
          :key="expert.id"
          class="expert-btn"
          :class="{ 'expert-btn--active': currentExpertId === expert.id }"
          @click="selectExpert(expert.id)"
        >
          <span class="expert-initials">{{ expert.initials }}</span>
          <span class="expert-name">{{ expert.name }}</span>
        </button>
      </div>
    </div>

    <!-- Statut de la session -->
    <div v-if="session && isCompleted" class="session-status session-status--completed">
      <UIcon name="i-heroicons-check-circle" />
      <span>Oral terminé</span>
      <span class="status-date mono" v-if="session.completedAt">
        {{ new Date(session.completedAt).toLocaleDateString('fr-CH') }}
      </span>
      <UButton
        size="xs"
        variant="ghost"
        color="gray"
        icon="i-heroicons-arrow-path"
        @click="reopenSession"
      >
        Rouvrir
      </UButton>
    </div>

    <!-- Score global -->
    <div class="score-summary" v-if="globalScore !== null">
      <span class="score-label">Note globale</span>
      <span class="score-final" :class="`score-${Math.round(globalScore)}`">
        {{ globalScore.toFixed(1) }}
      </span>
      <span class="score-max">/ 6</span>
      <UButton
        v-if="session && !isCompleted"
        size="xs"
        variant="soft"
        color="green"
        icon="i-heroicons-check"
        class="ml-auto"
        @click="completeSession"
      >
        Terminer l'oral
      </UButton>
    </div>

    <!-- Pas de session -->
    <div v-if="!session" class="no-session">
      <p>Aucune session d'oral démarrée pour cet élève.</p>
      <UButton @click="startSession" icon="i-heroicons-play" color="primary" size="sm">
        Démarrer la session
      </UButton>
    </div>

    <template v-else>
      <!-- Questions théoriques -->
      <div class="question-section" v-if="theoreticalQs.length">
        <h3 class="section-title">
          <span class="section-badge section-badge--theory">T</span>
          Questions théoriques
        </h3>
        <OralQuestionRow
          v-for="(q, idx) in theoreticalQs"
          :key="q.id"
          :question="q"
          :display-ref="getDisplayRef(q, idx)"
          :experts="experts"
          :session="session"
          :grades="grades"
          :current-expert-id="currentExpertId"
          :saving="saving === q.id"
          @score="(score) => saveScore(q.id, score)"
        />
      </div>

      <!-- Questions pratiques -->
      <div class="question-section" v-if="practicalQs.length">
        <h3 class="section-title">
          <span class="section-badge section-badge--practical">P</span>
          Questions pratiques
        </h3>
        <OralQuestionRow
          v-for="(q, idx) in practicalQs"
          :key="q.id"
          :question="q"
          :display-ref="getDisplayRef(q, idx)"
          :experts="experts"
          :session="session"
          :grades="grades"
          :current-expert-id="currentExpertId"
          :saving="saving === q.id"
          @score="(score) => saveScore(q.id, score)"
        />
      </div>
    </template>

  </div>
</template>

<style scoped>
.oral-panel { display: flex; flex-direction: column; gap: 2rem; }

/* Expert selector */
.expert-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 0.875rem 1.25rem;
}

.section-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--c-text-muted);
  white-space: nowrap;
}

.expert-list { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.expert-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  background: var(--c-bg-hover);
  border: 1px solid var(--c-border);
  color: var(--c-text-soft);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.expert-btn:hover { border-color: var(--c-border); color: var(--c-text); }

.expert-btn--active {
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-nuxt) 35%, transparent);
  color: var(--c-nuxt);
}

.expert-initials {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.75rem;
}

/* Score summary */
.score-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
}

.score-label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--c-text-muted);
  flex: 1;
}

.score-final {
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.score-max {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--c-text-muted);
}

/* Scores color classes (hérite de app.vue globals) */
.score-1 { color: var(--score-1); }
.score-2 { color: var(--score-2); }
.score-3 { color: var(--score-3); }
.score-4 { color: var(--score-4); }
.score-5 { color: var(--score-5); }
.score-6 { color: var(--score-6); }

/* Section */
.question-section { display: flex; flex-direction: column; gap: 0.75rem; }

.section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
}

.section-badge--theory {
  background: color-mix(in srgb, var(--c-info) 15%, transparent);
  color: var(--c-info);
  border: 1px solid color-mix(in srgb, var(--c-info) 30%, transparent);
}

.section-badge--practical {
  background: color-mix(in srgb, var(--c-vue) 15%, transparent);
  color: var(--c-vue);
  border: 1px solid color-mix(in srgb, var(--c-vue) 30%, transparent);
}

.no-session {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--c-text-muted);
  text-align: center;
  background: var(--c-bg-card);
  border: 1px dashed var(--c-border);
  border-radius: 12px;
}

/* Session status */
.session-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
}

.session-status--completed {
  background: color-mix(in srgb, var(--c-vue) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-vue) 30%, transparent);
  color: var(--c-vue);
}

.status-date {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin-left: auto;
  margin-right: 0.5rem;
}

.ml-auto { margin-left: auto; }
</style>
