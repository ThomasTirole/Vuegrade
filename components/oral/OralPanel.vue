<script setup lang="ts">
import type { Question, OralSession, OralGrade, User } from '~/types'
import { averageScore, computeOralResult, formatNumber, gradingFromClass, scoreLevel, scoreValues } from '~/utils/grading'

const props = defineProps<{ studentId: string }>()

const db = useDB()
const authStore = useAuthStore()
const toast = useToast()

const session = ref<OralSession | null>(null)
const questions = ref<Question[]>([])
const evaluators = ref<User[]>([]) // Teacher + experts de la classe
const loading = ref(true)
const loadError = ref<string | null>(null) // Erreur de chargement (affichée avec bouton Réessayer)
const starting = ref(false)
const saving = ref<string | null>(null) // questionId en cours de sauvegarde

// Quel évaluateur suis-je ? (stocké en localStorage pour persistance de session)
const currentExpertId = ref<string | null>(
  typeof window !== 'undefined' ? localStorage.getItem('vugrade_expert') : null
)

// Ref pour les grades (pour le realtime)
const grades = ref<OralGrade[]>([])

// Ref réactive pour studentId (pour le realtime)
const studentIdRef = toRef(props, 'studentId')

// Synchronisation realtime des notes et sessions
useRealtimeGrades(studentIdRef, session, grades)

// Charge les évaluateurs dès que la classe est connue (la session auth peut être restaurée après le montage)
watch(() => authStore.selectedClassId, async (classId) => {
  if (!classId) return
  try {
    evaluators.value = await db.classes.getEvaluators(classId)
  } catch (err) {
    console.error('[OralPanel] Erreur chargement évaluateurs:', err)
    loadError.value = 'Impossible de charger les évaluateurs.'
  }
}, { immediate: true })

onMounted(loadData)

/**
 * Charge les questions attribuées et la session de l'élève.
 * En cas d'erreur, on n'affiche PAS « Démarrer la session » (cela créait des doublons) :
 * on affiche l'erreur avec un bouton Réessayer.
 */
async function loadData() {
  loading.value = true
  loadError.value = null
  try {
    const [qs, sess] = await Promise.all([
      // Utilise getAssignedForStudent pour n'avoir que les questions attribuées
      db.questions.getAssignedForStudent(props.studentId),
      db.oral.getSessionByStudent(props.studentId),
    ])
    questions.value = qs
    session.value = sess
    // Initialise les grades depuis la session
    grades.value = sess?.grades ?? []
  } catch (err) {
    console.error('[OralPanel] Erreur chargement oral:', err)
    loadError.value = 'Impossible de charger l\'oral de cet élève. Vérifiez la connexion puis réessayez.'
  } finally {
    loading.value = false
  }
}

async function retry() {
  await loadData()
  if (!loadError.value && authStore.selectedClassId) {
    evaluators.value = await db.classes.getEvaluators(authStore.selectedClassId)
  }
}

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

// Barème et pondération de la classe
const grading = computed(() => gradingFromClass(authStore.selectedClass))

// Moyenne des évaluateurs pour une question (non arrondie)
function getQuestionAverage(questionId: string): number | null {
  return averageScore(evaluators.value.map(e => getScore(questionId, e.id)))
}

// Note globale pondérée (provisoire tant que toutes les questions ne sont pas notées)
const result = computed(() => computeOralResult(questions.value, getQuestionAverage, grading.value))

// Crée ou démarre une session (retourne la session existante si un autre évaluateur l'a déjà créée)
async function startSession() {
  starting.value = true
  try {
    const questionIds = questions.value.map(q => q.id)
    const sess = await db.oral.createSession(
      props.studentId,
      questionIds,
      authStore.selectedClassId ?? undefined
    )
    if (sess.status === 'pending') {
      await db.oral.updateSessionStatus(sess.id, 'in_progress')
      sess.status = 'in_progress'
    }
    session.value = sess
    grades.value = sess.grades
  } catch (err) {
    console.error('[OralPanel] Erreur démarrage session:', err)
    toast.add({
      title: 'Impossible de démarrer la session',
      description: 'Vérifiez la connexion puis réessayez.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    })
  } finally {
    starting.value = false
  }
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
  if (!scoreValues(grading.value).includes(score)) return
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

// ── Remarques globales (champ partagé, sauvegarde auto) ──
const notesDraft = ref('')
const notesFocused = ref(false)
const notesStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let notesTimer: ReturnType<typeof setTimeout> | null = null

// Synchronise depuis la session (chargement + realtime), sauf pendant la saisie locale
watch(() => session.value?.notes, (notes) => {
  if (!notesFocused.value) notesDraft.value = notes ?? ''
}, { immediate: true })

function onNotesInput() {
  if (notesTimer) clearTimeout(notesTimer)
  notesTimer = setTimeout(saveNotes, 800)
}

async function saveNotes() {
  if (notesTimer) {
    clearTimeout(notesTimer)
    notesTimer = null
  }
  if (!session.value || notesDraft.value === (session.value.notes ?? '')) return
  notesStatus.value = 'saving'
  try {
    await db.oral.updateSessionNotes(session.value.id, notesDraft.value)
    session.value.notes = notesDraft.value
    notesStatus.value = 'saved'
  } catch (err) {
    console.error('[OralPanel] Erreur sauvegarde remarques:', err)
    notesStatus.value = 'error'
  }
}

function onNotesBlur() {
  notesFocused.value = false
  saveNotes()
}

onBeforeUnmount(() => {
  // Ne pas perdre une saisie en cours si on change d'élève
  if (notesTimer) saveNotes()
})

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

    <!-- Sélection évaluateur (teacher + experts) -->
    <div class="expert-selector">
      <span class="section-label">Je suis :</span>
      <div class="expert-list">
        <button
          v-for="evaluator in evaluators"
          :key="evaluator.id"
          class="expert-btn"
          :class="{ 'expert-btn--active': currentExpertId === evaluator.id }"
          @click="selectExpert(evaluator.id)"
        >
          <span class="expert-initials">{{ evaluator.initials || evaluator.name.substring(0, 3).toUpperCase() }}</span>
          <span class="expert-name">{{ evaluator.name }}</span>
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
    <div class="score-summary" v-if="result">
      <div class="score-label">
        <span>Note globale</span>
        <span class="score-detail">
          <template v-if="result.points !== undefined">
            {{ formatNumber(result.points) }} / {{ formatNumber(result.maxPoints!) }} pts ·
          </template>
          exacte {{ formatNumber(result.exactGrade) }}
          · T ×{{ formatNumber(grading.theoreticalWeight) }} / P ×{{ formatNumber(grading.practicalWeight) }}
          <template v-if="result.gradedCount < result.totalCount">
            · provisoire ({{ result.gradedCount }}/{{ result.totalCount }} questions notées)
          </template>
        </span>
      </div>
      <span class="score-final" :class="`score-${scoreLevel(result.grade, { ...grading, scale: 'grade' })}`">
        {{ result.grade.toFixed(1) }}
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

    <!-- Chargement -->
    <div v-if="loading" class="no-session">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
    </div>

    <!-- Erreur de chargement -->
    <div v-else-if="loadError" class="no-session no-session--error">
      <UIcon name="i-heroicons-exclamation-triangle" class="error-icon" />
      <p>{{ loadError }}</p>
      <UButton @click="retry" icon="i-heroicons-arrow-path" color="red" variant="soft" size="sm">
        Réessayer
      </UButton>
    </div>

    <!-- Pas de session -->
    <div v-else-if="!session" class="no-session">
      <p>Aucune session d'oral démarrée pour cet élève.</p>
      <UButton
        @click="startSession"
        :loading="starting"
        icon="i-heroicons-play"
        color="primary"
        size="sm"
      >
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
          :evaluators="evaluators"
          :session="session"
          :grades="grades"
          :grading="grading"
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
          :evaluators="evaluators"
          :session="session"
          :grades="grades"
          :grading="grading"
          :current-expert-id="currentExpertId"
          :saving="saving === q.id"
          @score="(score) => saveScore(q.id, score)"
        />
      </div>

      <!-- Remarques globales de l'oral -->
      <div class="question-section">
        <h3 class="section-title">
          <UIcon name="i-heroicons-chat-bubble-left-ellipsis" />
          Remarques
          <span class="notes-status mono" :class="`notes-status--${notesStatus}`">
            <template v-if="notesStatus === 'saving'">enregistrement…</template>
            <template v-else-if="notesStatus === 'saved'">enregistré</template>
            <template v-else-if="notesStatus === 'error'">erreur d'enregistrement</template>
          </span>
        </h3>
        <UTextarea
          v-model="notesDraft"
          :rows="4"
          autoresize
          placeholder="Remarques sur l'oral (partagées entre évaluateurs)…"
          @focus="notesFocused = true"
          @blur="onNotesBlur"
          @update:model-value="onNotesInput"
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
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.score-detail { font-size: 0.68rem; opacity: 0.8; }

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

/* Remarques */
.notes-status {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--c-text-muted);
}
.notes-status--saved { color: var(--c-vue); }
.notes-status--error { color: var(--c-error); }

.no-session--error {
  color: var(--c-error);
  border-color: color-mix(in srgb, var(--c-error) 40%, transparent);
}

.error-icon { font-size: 1.75rem; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; font-size: 1.25rem; }

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
