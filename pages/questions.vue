<script setup lang="ts">
// Page du pool de questions théoriques uniquement
// Les questions pratiques sont créées directement sur la fiche élève

import type { Question } from '~/types'

const questionsStore = useQuestionsStore()
const { pool, loading } = storeToRefs(questionsStore)

onMounted(() => questionsStore.fetchPool())

const showModal = ref(false)
const editingQuestion = ref<Question | null>(null)
const toast = useToast()
const { confirm } = useConfirm()

// Filtrer uniquement les questions théoriques (pool)
const theoreticalQs = computed(() => pool.value.filter(q => q.type === 'theoretical'))

function openNew() {
  editingQuestion.value = null
  showModal.value = true
}

function openEdit(q: Question) {
  editingQuestion.value = q
  showModal.value = true
}

async function deleteQuestion(q: Question) {
  const confirmed = await confirm({
    title: 'Supprimer cette question ?',
    message: `La question "${q.title}" sera définitivement supprimée du pool.`,
    confirmLabel: 'Supprimer',
    confirmColor: 'red',
  })

  if (!confirmed) return

  await questionsStore.deleteQuestion(q.id)
  toast.add({
    title: 'Question supprimée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
}

async function handleSave(payload: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) {
  await questionsStore.addQuestion(payload)
  showModal.value = false
  toast.add({
    title: 'Question créée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
}

async function handleUpdate(payload: Question) {
  await questionsStore.updateQuestion(payload.id, payload)
  showModal.value = false
  toast.add({
    title: 'Question modifiée',
    icon: 'i-heroicons-check-circle',
    color: 'green',
  })
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="page-title">Pool de questions théoriques</h1>
          <p class="page-subtitle mono">Questions communes attribuables aux élèves</p>
        </div>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
          @click="openNew"
        >
          Nouvelle question
        </UButton>
      </div>

      <div class="q-counts">
        <div class="q-count-chip">
          <span class="mono">{{ theoreticalQs.length }}</span>
          <span>questions</span>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
      Chargement…
    </div>

    <!-- Question list -->
    <div v-else class="question-list">
      <UiQuestionCard
        v-for="q in theoreticalQs"
        :key="q.id"
        :question="q"
        @edit="openEdit(q)"
        @delete="deleteQuestion(q)"
      />
      <div v-if="theoreticalQs.length === 0" class="empty-state">
        <UIcon name="i-heroicons-document-text" class="empty-icon" />
        <p>Aucune question théorique pour le moment.</p>
        <p class="muted">Les questions créées ici pourront être attribuées aux élèves.</p>
        <UButton size="sm" variant="outline" @click="openNew">Créer une question</UButton>
      </div>
    </div>

    <!-- Question modal (théorique uniquement) -->
    <UiQuestionModal
      v-if="showModal"
      :question="editingQuestion"
      mode="theoretical"
      @save="handleSave"
      @update="handleUpdate"
      @close="showModal = false"
    />

  </div>
</template>

<style scoped>
.page { padding: 2rem 2.5rem; max-width: 1000px; }

.page-header { margin-bottom: 2rem; }
.header-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; margin-bottom: 1rem;
}
.page-title {
  font-size: 1.75rem; font-weight: 700;
  letter-spacing: -0.03em; margin: 0 0 0.25rem;
}
.page-subtitle { font-family: var(--font-mono); font-size: 0.8rem; color: var(--c-text-muted); margin: 0; }

.q-counts { display: flex; gap: 0.75rem; }
.q-count-chip {
  display: flex; align-items: baseline; gap: 0.35rem;
  padding: 0.4rem 0.875rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  font-size: 0.8rem; color: var(--c-text-soft);
}
.q-count-chip .mono { font-size: 1rem; font-weight: 600; color: var(--c-text); }

.question-list { display: flex; flex-direction: column; gap: 0.75rem; }

.loading-state {
  display: flex; align-items: center; gap: 0.75rem;
  color: var(--c-text-muted); padding: 3rem;
  font-family: var(--font-mono); font-size: 0.875rem;
}
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.75rem; padding: 4rem 2rem; color: var(--c-text-muted); text-align: center;
  background: var(--c-bg-card); border: 1px dashed var(--c-border); border-radius: 12px;
}
.empty-icon { font-size: 2.5rem; color: var(--c-text-muted); opacity: 0.5; }
.muted { font-size: 0.8rem; margin: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
