<script setup lang="ts">
import type { Question } from '~/types'
defineProps<{ question: Question }>()
defineEmits<{ edit: []; delete: [] }>()
const expanded = ref(false)
</script>

<template>
  <div class="q-card">
    <div class="q-header" @click="expanded = !expanded">
      <span
        class="q-type-badge mono"
        :class="question.type === 'theoretical' ? 'badge--theory' : 'badge--practical'"
      >
        {{ question.ref }}
      </span>
      <span class="q-title">{{ question.title }}</span>
      <div class="q-actions" @click.stop>
        <button class="action-btn" @click="$emit('edit')" title="Modifier">
          <UIcon name="i-heroicons-pencil" />
        </button>
        <button class="action-btn action-btn--danger" @click="$emit('delete')" title="Supprimer">
          <UIcon name="i-heroicons-trash" />
        </button>
      </div>
      <UIcon
        :name="expanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        class="toggle-icon"
      />
    </div>

    <div v-if="expanded" class="q-body">
      <div class="q-section">
        <span class="q-label">Question</span>
        <p class="q-text">{{ question.question }}</p>
      </div>
      <div class="q-section" v-if="question.expectedAnswer">
        <span class="q-label">Réponse attendue</span>
        <p class="q-text expected">{{ question.expectedAnswer }}</p>
      </div>
      <div class="q-section" v-if="question.hint">
        <span class="q-label">💡 Indice</span>
        <p class="q-text muted">{{ question.hint }}</p>
      </div>
      <div class="q-section" v-if="question.codeSnippet">
        <span class="q-label">Code ({{ question.codeLanguage ?? 'vue' }})</span>
        <pre class="code-block"><code>{{ question.codeSnippet }}</code></pre>
      </div>
      <div v-if="question.tags?.length" class="q-tags">
        <span v-for="tag in question.tags" :key="tag" class="tag mono">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.q-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.q-card:hover { border-color: color-mix(in srgb, var(--c-nuxt) 25%, transparent); }

.q-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer; transition: background 0.12s;
}
.q-header:hover { background: var(--c-bg-hover); }

.q-type-badge {
  font-size: 0.7rem; padding: 2px 8px; border-radius: 5px;
  white-space: nowrap; flex-shrink: 0; font-weight: 500;
}
.badge--theory {
  background: color-mix(in srgb, var(--c-info) 12%, transparent);
  color: var(--c-info);
  border: 1px solid color-mix(in srgb, var(--c-info) 30%, transparent);
}
.badge--practical {
  background: color-mix(in srgb, var(--c-vue) 12%, transparent);
  color: var(--c-vue);
  border: 1px solid color-mix(in srgb, var(--c-vue) 30%, transparent);
}

.q-title { flex: 1; font-size: 0.875rem; font-weight: 500; }
.toggle-icon { color: var(--c-text-muted); font-size: 0.85rem; }

.q-actions { display: flex; gap: 0.3rem; }
.action-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  background: transparent; border: 1px solid transparent;
  color: var(--c-text-muted); cursor: pointer; transition: all 0.12s;
  font-size: 0.8rem;
}
.action-btn:hover { background: var(--c-bg-hover); border-color: var(--c-border); color: var(--c-text); }
.action-btn--danger:hover { color: var(--c-error); border-color: color-mix(in srgb, var(--c-error) 30%, transparent); }

.q-body {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--c-border-soft);
  display: flex; flex-direction: column; gap: 0.875rem;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } }

.q-section { display: flex; flex-direction: column; gap: 0.3rem; }
.q-label {
  font-family: var(--font-mono); font-size: 0.65rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--c-text-muted);
}
.q-text { font-size: 0.85rem; color: var(--c-text); margin: 0; line-height: 1.6; }
.expected {
  background: color-mix(in srgb, var(--c-vue) 6%, transparent);
  border-left: 2px solid var(--c-vue);
  padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0;
}
.muted { color: var(--c-text-soft); font-style: italic; }

.code-block {
  background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 0.75rem 1rem; margin: 0;
  font-family: var(--font-mono); font-size: 0.78rem;
  line-height: 1.6; color: var(--c-text-soft);
  overflow-x: auto; white-space: pre-wrap;
}

.q-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.tag {
  font-size: 0.65rem; padding: 2px 8px;
  background: var(--c-bg-hover); border: 1px solid var(--c-border);
  border-radius: 20px; color: var(--c-text-muted);
}
</style>
