<script setup lang="ts">
// Modal de sélection des questions théoriques du pool pour un élève
// Affiche les questions non encore attribuées à cet élève

import type { Question } from '~/types'

const props = defineProps<{
  assignedQuestionIds: string[]
}>()

const emit = defineEmits<{
  select: [question: Question]
  close: []
}>()

const db = useDB()
const loading = ref(true)
const poolQuestions = ref<Question[]>([])
const searchQuery = ref('')

onMounted(async () => {
  try {
    poolQuestions.value = await db.questions.getTheoreticalPool()
  } finally {
    loading.value = false
  }
})

// Questions disponibles (non encore attribuées)
const availableQuestions = computed(() => {
  return poolQuestions.value.filter(q => !props.assignedQuestionIds.includes(q.id))
})

// Filtrer par recherche
const filteredQuestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return availableQuestions.value
  return availableQuestions.value.filter(q =>
    q.title.toLowerCase().includes(query) ||
    q.question.toLowerCase().includes(query) ||
    q.tags?.some(t => t.toLowerCase().includes(query))
  )
})

function selectQuestion(q: Question) {
  emit('select', q)
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <span class="type-badge">T</span>
            <h2 class="modal-title">Sélectionner une question théorique</h2>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Search -->
          <div class="search-bar">
            <UIcon name="i-heroicons-magnifying-glass" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher par titre, contenu ou tag…"
              class="search-input"
            />
          </div>

          <!-- Loading -->
          <div v-if="loading" class="loading-state">
            <UIcon name="i-heroicons-arrow-path" class="spin" />
            Chargement du pool…
          </div>

          <!-- Question list -->
          <div v-else class="question-list">
            <div
              v-for="q in filteredQuestions"
              :key="q.id"
              class="question-item"
              @click="selectQuestion(q)"
            >
              <div class="question-content">
                <span class="question-title">{{ q.title }}</span>
                <p class="question-text">{{ q.question }}</p>
                <div v-if="q.tags?.length" class="question-tags">
                  <span v-for="tag in q.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              <UIcon name="i-heroicons-plus-circle" class="add-icon" />
            </div>

            <!-- Empty states -->
            <div v-if="availableQuestions.length === 0 && !loading" class="empty-state">
              <UIcon name="i-heroicons-check-circle" class="empty-icon" />
              <p>Toutes les questions du pool sont déjà attribuées à cet élève.</p>
              <NuxtLink to="/questions" class="link">
                Gérer le pool de questions →
              </NuxtLink>
            </div>

            <div v-else-if="filteredQuestions.length === 0 && searchQuery" class="empty-state">
              <p>Aucune question ne correspond à "{{ searchQuery }}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}

.modal {
  background: var(--c-bg-soft);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  width: 100%; max-width: 600px;
  max-height: 80vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}
.modal-header-content {
  display: flex; align-items: center; gap: 0.75rem;
}
.modal-title { font-size: 1rem; font-weight: 600; margin: 0; }

.type-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600;
  background: color-mix(in srgb, var(--c-info) 15%, transparent);
  color: var(--c-info);
  border: 1px solid color-mix(in srgb, var(--c-info) 30%, transparent);
}

.close-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  background: transparent; border: none; color: var(--c-text-muted);
  cursor: pointer; transition: all 0.12s;
}
.close-btn:hover { background: var(--c-bg-hover); color: var(--c-text); }

.modal-body {
  padding: 1rem 1.5rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.search-bar {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
}
.search-icon { color: var(--c-text-muted); font-size: 1rem; }
.search-input {
  flex: 1; background: transparent; border: none;
  color: var(--c-text); font-size: 0.875rem;
  outline: none;
}
.search-input::placeholder { color: var(--c-text-muted); }

.question-list {
  display: flex; flex-direction: column; gap: 0.5rem;
}

.question-item {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.875rem 1rem;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.question-item:hover {
  border-color: var(--c-nuxt);
  background: color-mix(in srgb, var(--c-nuxt) 5%, var(--c-bg-card));
}

.question-content { flex: 1; min-width: 0; }
.question-title {
  display: block;
  font-weight: 600; font-size: 0.875rem;
  color: var(--c-text);
  margin-bottom: 0.25rem;
}
.question-text {
  font-size: 0.8rem; color: var(--c-text-soft);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-tags {
  display: flex; flex-wrap: wrap; gap: 0.35rem;
  margin-top: 0.5rem;
}
.tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  padding: 2px 6px;
  background: var(--c-bg-hover);
  border-radius: 4px;
  color: var(--c-text-muted);
}

.add-icon {
  font-size: 1.5rem;
  color: var(--c-text-muted);
  transition: color 0.15s;
  flex-shrink: 0;
}
.question-item:hover .add-icon { color: var(--c-nuxt); }

.loading-state {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  color: var(--c-text-muted); padding: 3rem;
  font-family: var(--font-mono); font-size: 0.875rem;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 0.5rem; padding: 2rem; color: var(--c-text-muted); text-align: center;
}
.empty-icon { font-size: 2rem; color: var(--c-nuxt); }
.link {
  color: var(--c-nuxt); text-decoration: none; font-size: 0.8rem;
  transition: opacity 0.15s;
}
.link:hover { opacity: 0.8; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
