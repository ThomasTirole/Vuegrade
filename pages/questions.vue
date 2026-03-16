<script setup lang="ts">
import type { Question } from '~/types'

const questionsStore = useQuestionsStore()
const { pool, loading } = storeToRefs(questionsStore)

onMounted(() => questionsStore.fetchPool())

const showModal = ref(false)
const editingQuestion = ref<Question | null>(null)
const activeTab = ref<'theoretical' | 'practical'>('theoretical')

const theoreticalQs = computed(() => pool.value.filter(q => q.type === 'theoretical'))
const practicalQs = computed(() => pool.value.filter(q => q.type === 'practical'))

function openNew() {
  editingQuestion.value = null
  showModal.value = true
}

function openEdit(q: Question) {
  editingQuestion.value = q
  showModal.value = true
}

async function deleteQuestion(q: Question) {
  if (!confirm(`Supprimer la question "${q.ref} — ${q.title}" ?`)) return
  await questionsStore.deleteQuestion(q.id)
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="page-title">Pool de questions</h1>
          <p class="page-subtitle mono">Questions théoriques et pratiques communes</p>
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
          <span>théoriques</span>
        </div>
        <div class="q-count-chip">
          <span class="mono">{{ practicalQs.length }}</span>
          <span>pratiques</span>
        </div>
      </div>
    </header>

    <!-- Tabs -->
    <div class="tabs-bar">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'theoretical' }"
        @click="activeTab = 'theoretical'"
      >
        <span class="section-badge section-badge--theory">T</span>
        Théoriques
        <span class="tab-count mono">{{ theoreticalQs.length }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'practical' }"
        @click="activeTab = 'practical'"
      >
        <span class="section-badge section-badge--practical">P</span>
        Pratiques
        <span class="tab-count mono">{{ practicalQs.length }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="spin" />
      Chargement…
    </div>

    <!-- Question list -->
    <div v-else class="question-list">
      <template v-if="activeTab === 'theoretical'">
        <QuestionCard
          v-for="q in theoreticalQs"
          :key="q.id"
          :question="q"
          @edit="openEdit(q)"
          @delete="deleteQuestion(q)"
        />
        <div v-if="theoreticalQs.length === 0" class="empty-state">
          <p>Aucune question théorique pour le moment.</p>
          <UButton size="sm" variant="outline" @click="openNew">Ajouter</UButton>
        </div>
      </template>

      <template v-if="activeTab === 'practical'">
        <QuestionCard
          v-for="q in practicalQs"
          :key="q.id"
          :question="q"
          @edit="openEdit(q)"
          @delete="deleteQuestion(q)"
        />
        <div v-if="practicalQs.length === 0" class="empty-state">
          <p>Aucune question pratique pour le moment.</p>
          <UButton size="sm" variant="outline" @click="openNew">Ajouter</UButton>
        </div>
      </template>
    </div>

    <!-- Question modal -->
    <QuestionModal
      v-if="showModal"
      :question="editingQuestion"
      :default-type="activeTab"
      @save="questionsStore.addQuestion($event); showModal = false"
      @update="questionsStore.updateQuestion($event.id, $event); showModal = false"
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

.tabs-bar {
  display: flex; gap: 2px;
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 1.5rem;
}
.tab-btn {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: transparent; border: none;
  border-bottom: 2px solid transparent;
  color: var(--c-text-soft);
  font-size: 0.85rem; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  margin-bottom: -1px;
  font-family: var(--font-display);
}
.tab-btn:hover { color: var(--c-text); }
.tab-btn--active { color: var(--c-nuxt); border-bottom-color: var(--c-nuxt); }

.tab-count {
  font-size: 0.7rem; padding: 1px 6px;
  background: var(--c-bg-hover); border-radius: 4px;
  color: var(--c-text-muted);
}

.question-list { display: flex; flex-direction: column; gap: 0.75rem; }

.section-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 5px;
  font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600;
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

.loading-state {
  display: flex; align-items: center; gap: 0.75rem;
  color: var(--c-text-muted); padding: 3rem;
  font-family: var(--font-mono); font-size: 0.875rem;
}
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; padding: 4rem 2rem; color: var(--c-text-muted); text-align: center;
  background: var(--c-bg-card); border: 1px dashed var(--c-border); border-radius: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
