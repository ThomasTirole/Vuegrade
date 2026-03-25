<script setup lang="ts">
// Onglet Questions de la fiche élève
// Gère les questions théoriques (sélection du pool) et pratiques (CRUD)

import type { Question } from '~/types'

const props = defineProps<{
  studentId: string
}>()

const db = useDB()
const toast = useToast()
const { confirm } = useConfirm()

// État
const loading = ref(true)
const theoreticalQuestions = ref<Question[]>([])
const practicalQuestions = ref<Question[]>([])
const assignedPositions = ref<{ questionId: string; position: number }[]>([])

// Modals
const showSelector = ref(false)
const showPracticalModal = ref(false)
const editingPractical = ref<Question | null>(null)

// Chargement des données
onMounted(() => loadQuestions())

async function loadQuestions() {
  loading.value = true
  try {
    // Charger les attributions (position des questions théoriques)
    assignedPositions.value = await db.studentQuestions.getForStudent(props.studentId)

    // Charger les questions théoriques du pool
    const pool = await db.questions.getTheoreticalPool()

    // Mapper les questions théoriques attribuées avec leur position
    theoreticalQuestions.value = assignedPositions.value
      .map(ap => {
        const q = pool.find(p => p.id === ap.questionId)
        return q ? { ...q, position: ap.position } : null
      })
      .filter((q): q is Question & { position: number } => q !== null)
      .sort((a, b) => a.position - b.position)

    // Charger les questions pratiques
    practicalQuestions.value = await db.questions.getPracticalForStudent(props.studentId)
  } finally {
    loading.value = false
  }
}

// IDs des questions déjà attribuées
const assignedQuestionIds = computed(() => assignedPositions.value.map(a => a.questionId))

// Générer ref dynamique (T-1, T-2, P-1, etc.)
function getRef(type: 'T' | 'P', index: number): string {
  return `${type}-${index + 1}`
}

// --- THÉORIQUES ---
async function onSelectTheoretical(question: Question) {
  const newPosition = assignedPositions.value.length + 1
  await db.studentQuestions.assign(props.studentId, question.id, newPosition)
  showSelector.value = false
  toast.add({
    title: 'Question attribuée',
    description: question.title,
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
  await loadQuestions()
}

async function removeTheoretical(questionId: string) {
  const question = theoreticalQuestions.value.find(q => q.id === questionId)
  const confirmed = await confirm({
    title: 'Retirer cette question ?',
    message: `La question "${question?.title}" sera retirée de cet élève mais restera dans le pool.`,
    confirmLabel: 'Retirer',
    confirmColor: 'orange',
  })

  if (!confirmed) return

  await db.studentQuestions.unassign(props.studentId, questionId)
  // Recompacter les positions
  const remaining = assignedPositions.value
    .filter(a => a.questionId !== questionId)
    .sort((a, b) => a.position - b.position)
    .map((a, idx) => a.questionId)
  await db.studentQuestions.reorder(props.studentId, remaining)
  toast.add({
    title: 'Question retirée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
  await loadQuestions()
}

async function moveTheoretical(questionId: string, direction: 'up' | 'down') {
  const ids = theoreticalQuestions.value.map(q => q.id)
  const idx = ids.indexOf(questionId)
  if (idx === -1) return

  const newIdx = direction === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= ids.length) return

  // Swap
  ;[ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]]
  await db.studentQuestions.reorder(props.studentId, ids)
  await loadQuestions()
}

// --- PRATIQUES ---
function openNewPractical() {
  editingPractical.value = null
  showPracticalModal.value = true
}

function openEditPractical(q: Question) {
  editingPractical.value = q
  showPracticalModal.value = true
}

async function savePractical(payload: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) {
  await db.questions.create(payload)
  showPracticalModal.value = false
  toast.add({
    title: 'Question pratique créée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
  await loadQuestions()
}

async function updatePractical(payload: Question) {
  await db.questions.update(payload.id, payload)
  showPracticalModal.value = false
  toast.add({
    title: 'Question modifiée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
  await loadQuestions()
}

async function deletePractical(q: Question) {
  const confirmed = await confirm({
    title: 'Supprimer cette question ?',
    message: `La question pratique "${q.title}" sera définitivement supprimée.`,
    confirmLabel: 'Supprimer',
    confirmColor: 'red',
  })

  if (!confirmed) return

  await db.questions.delete(q.id)
  toast.add({
    title: 'Question supprimée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
  await loadQuestions()
}
</script>

<template>
  <div class="student-questions">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
      Chargement des questions…
    </div>

    <template v-else>
      <!-- SECTION THÉORIQUES -->
      <section class="section">
        <div class="section-header">
          <div class="section-title-row">
            <span class="section-badge section-badge--theory">T</span>
            <h3 class="section-title">Questions théoriques</h3>
            <span class="section-count mono">{{ theoreticalQuestions.length }}</span>
          </div>
          <UButton
            icon="i-heroicons-plus"
            size="xs"
            variant="outline"
            @click="showSelector = true"
          >
            Ajouter
          </UButton>
        </div>

        <div v-if="theoreticalQuestions.length === 0" class="empty-section">
          <p>Aucune question théorique attribuée.</p>
          <UButton size="xs" variant="soft" @click="showSelector = true">
            Sélectionner du pool
          </UButton>
        </div>

        <div v-else class="question-list">
          <div
            v-for="(q, idx) in theoreticalQuestions"
            :key="q.id"
            class="question-row"
          >
            <span class="question-ref mono">{{ getRef('T', idx) }}</span>
            <div class="question-content">
              <span class="question-title">{{ q.title }}</span>
              <p class="question-text">{{ q.question }}</p>
            </div>
            <div class="question-actions">
              <button
                class="action-btn"
                :disabled="idx === 0"
                @click="moveTheoretical(q.id, 'up')"
                title="Monter"
              >
                <UIcon name="i-heroicons-chevron-up" />
              </button>
              <button
                class="action-btn"
                :disabled="idx === theoreticalQuestions.length - 1"
                @click="moveTheoretical(q.id, 'down')"
                title="Descendre"
              >
                <UIcon name="i-heroicons-chevron-down" />
              </button>
              <button
                class="action-btn action-btn--danger"
                @click="removeTheoretical(q.id)"
                title="Retirer"
              >
                <UIcon name="i-heroicons-x-mark" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION PRATIQUES -->
      <section class="section">
        <div class="section-header">
          <div class="section-title-row">
            <span class="section-badge section-badge--practical">P</span>
            <h3 class="section-title">Questions pratiques</h3>
            <span class="section-count mono">{{ practicalQuestions.length }}</span>
          </div>
          <UButton
            icon="i-heroicons-plus"
            size="xs"
            variant="outline"
            @click="openNewPractical"
          >
            Créer
          </UButton>
        </div>

        <div v-if="practicalQuestions.length === 0" class="empty-section">
          <p>Aucune question pratique pour cet élève.</p>
          <UButton size="xs" variant="soft" @click="openNewPractical">
            Créer une question
          </UButton>
        </div>

        <div v-else class="question-list">
          <div
            v-for="(q, idx) in practicalQuestions"
            :key="q.id"
            class="question-row question-row--practical"
          >
            <span class="question-ref mono">{{ getRef('P', idx) }}</span>
            <div class="question-content">
              <span class="question-title">{{ q.title }}</span>
              <p class="question-text">{{ q.question }}</p>
              <div v-if="q.codeSnippet" class="code-indicator mono">
                <UIcon name="i-heroicons-code-bracket" />
                Code {{ q.codeLanguage }}
              </div>
            </div>
            <div class="question-actions">
              <button
                class="action-btn"
                @click="openEditPractical(q)"
                title="Modifier"
              >
                <UIcon name="i-heroicons-pencil" />
              </button>
              <button
                class="action-btn action-btn--danger"
                @click="deletePractical(q)"
                title="Supprimer"
              >
                <UIcon name="i-heroicons-trash" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Modal sélection théorique -->
    <StudentQuestionSelector
      v-if="showSelector"
      :assigned-question-ids="assignedQuestionIds"
      @select="onSelectTheoretical"
      @close="showSelector = false"
    />

    <!-- Modal création/édition pratique -->
    <UiQuestionModal
      v-if="showPracticalModal"
      :question="editingPractical"
      mode="practical"
      :student-id="studentId"
      @save="savePractical"
      @update="updatePractical"
      @close="showPracticalModal = false"
    />
  </div>
</template>

<style scoped>
.student-questions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  color: var(--c-text-muted); padding: 3rem;
  font-family: var(--font-mono); font-size: 0.875rem;
}

/* Sections */
.section {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--c-border-soft);
  background: var(--c-bg-soft);
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.section-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 6px;
  font-family: var(--font-mono); font-size: 0.7rem; font-weight: 600;
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

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.section-count {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--c-bg-hover);
  border-radius: 4px;
  color: var(--c-text-muted);
}

.empty-section {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 2rem;
  color: var(--c-text-muted); text-align: center;
  font-size: 0.85rem;
}

/* Question list */
.question-list {
  display: flex;
  flex-direction: column;
}

.question-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--c-border-soft);
  transition: background 0.15s;
}
.question-row:last-child { border-bottom: none; }
.question-row:hover { background: var(--c-bg-hover); }

.question-ref {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-info);
  min-width: 36px;
}
.question-row--practical .question-ref {
  color: var(--c-vue);
}

.question-content {
  flex: 1;
  min-width: 0;
}

.question-title {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--c-text);
  margin-bottom: 0.2rem;
}

.question-text {
  font-size: 0.8rem;
  color: var(--c-text-soft);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.code-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.4rem;
  font-size: 0.7rem;
  color: var(--c-text-muted);
  padding: 2px 6px;
  background: var(--c-bg);
  border-radius: 4px;
}

.question-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn {
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
  transition: all 0.12s;
}
.action-btn:hover:not(:disabled) {
  background: var(--c-bg);
  border-color: var(--c-border);
  color: var(--c-text);
}
.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.action-btn--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--c-error) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-error) 30%, transparent);
  color: var(--c-error);
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
