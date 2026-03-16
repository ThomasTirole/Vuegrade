<script setup lang="ts">
import { SCORE_LABELS } from '~/types'
import type { Question, OralSession, Expert } from '~/types'

const props = defineProps<{
  question: Question
  experts: Expert[]
  session: OralSession
  currentExpertId: string | null
  saving: boolean
}>()

const emit = defineEmits<{
  score: [value: number]
}>()

const expanded = ref(false)
const scoreValues = [1, 2, 3, 4, 5, 6]

// Récupère le score d'un expert pour cette question
function getExpertScore(expertId: string): number | null {
  const grade = props.session.grades.find(
    g => g.questionId === props.question.id && g.expertId === expertId
  )
  return grade?.score ?? null
}

// Note finale (moyenne des experts)
const finalScore = computed(() => {
  const expertScores = props.experts
    .map(e => getExpertScore(e.id))
    .filter((s): s is number => s !== null)
  if (expertScores.length === 0) return null
  const avg = expertScores.reduce((a, b) => a + b, 0) / expertScores.length
  return Math.round(avg * 2) / 2
})

// Score actuel de l'expert courant pour cette question
const currentExpertScore = computed(() => {
  if (!props.currentExpertId) return null
  return getExpertScore(props.currentExpertId)
})
</script>

<template>
  <div class="question-row">
    <!-- Row header -->
    <div class="row-header" @click="expanded = !expanded">
      <span class="q-ref mono">{{ question.ref }}</span>
      <span class="q-title">{{ question.title }}</span>

      <!-- Scores par expert -->
      <div class="expert-scores">
        <div
          v-for="expert in experts"
          :key="expert.id"
          class="expert-score"
          :title="expert.name"
        >
          <span class="expert-init mono">{{ expert.initials }}</span>
          <span
            v-if="getExpertScore(expert.id) !== null"
            class="score-dot"
            :class="`score-dot--${getExpertScore(expert.id)}`"
          >
            {{ getExpertScore(expert.id) }}
          </span>
          <span v-else class="score-dot score-dot--empty">—</span>
        </div>
      </div>

      <!-- Note finale -->
      <span
        v-if="finalScore !== null"
        class="final-score mono"
        :class="`score-${Math.round(finalScore)}`"
      >
        {{ finalScore.toFixed(1) }}
      </span>
      <span v-else class="final-placeholder mono">—</span>

      <UIcon
        :name="expanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        class="toggle-icon"
      />
    </div>

    <!-- Expanded detail -->
    <div v-if="expanded" class="row-detail">
      <!-- Question complète -->
      <div class="detail-section">
        <span class="detail-label">Question</span>
        <p class="detail-text">{{ question.question }}</p>
      </div>

      <!-- Réponse attendue -->
      <div class="detail-section" v-if="question.expectedAnswer">
        <span class="detail-label">Réponse attendue</span>
        <p class="detail-text expected">{{ question.expectedAnswer }}</p>
      </div>

      <!-- Indice -->
      <div class="detail-section hint-section" v-if="question.hint">
        <span class="detail-label">💡 Indice</span>
        <p class="detail-text muted">{{ question.hint }}</p>
      </div>

      <!-- Code snippet -->
      <div class="detail-section" v-if="question.codeSnippet">
        <span class="detail-label">Code</span>
        <pre class="code-block"><code>{{ question.codeSnippet }}</code></pre>
      </div>

      <!-- Notation -->
      <div class="scoring-row" v-if="currentExpertId">
        <span class="detail-label">Ma note</span>
        <div class="score-buttons">
          <button
            v-for="s in scoreValues"
            :key="s"
            class="score-btn"
            :class="[`score-btn--${s}`, { 'score-btn--selected': currentExpertScore === s }]"
            :title="SCORE_LABELS[s]"
            :disabled="saving"
            @click="emit('score', s)"
          >
            {{ s }}
          </button>
        </div>
        <span class="score-hint mono">{{ SCORE_LABELS[1] }} → {{ SCORE_LABELS[6] }}</span>
      </div>
      <div v-else class="no-expert-warn">
        <UIcon name="i-heroicons-exclamation-triangle" />
        Sélectionnez votre profil expert pour noter.
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-row {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.question-row:hover { border-color: var(--c-border); }

.row-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.row-header:hover { background: var(--c-bg-hover); }

.q-ref {
  font-size: 0.7rem;
  color: var(--c-nuxt);
  background: color-mix(in srgb, var(--c-nuxt) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-nuxt) 25%, transparent);
  padding: 2px 7px;
  border-radius: 5px;
  white-space: nowrap;
}

.q-title {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.4;
}

.expert-scores {
  display: flex;
  gap: 0.5rem;
}

.expert-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.expert-init {
  font-size: 0.6rem;
  color: var(--c-text-muted);
  text-transform: uppercase;
}

.score-dot {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  width: 24px; height: 24px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}

.score-dot--empty {
  color: var(--c-text-muted);
  background: var(--c-bg);
  border: 1px solid var(--c-border-soft);
}

/* Scores colorés */
.score-dot--1 { background: color-mix(in srgb, var(--score-1) 15%, transparent); color: var(--score-1); border: 1px solid var(--score-1); }
.score-dot--2 { background: color-mix(in srgb, var(--score-2) 15%, transparent); color: var(--score-2); border: 1px solid var(--score-2); }
.score-dot--3 { background: color-mix(in srgb, var(--score-3) 15%, transparent); color: var(--score-3); border: 1px solid var(--score-3); }
.score-dot--4 { background: color-mix(in srgb, var(--score-4) 15%, transparent); color: var(--score-4); border: 1px solid var(--score-4); }
.score-dot--5 { background: color-mix(in srgb, var(--score-5) 15%, transparent); color: var(--score-5); border: 1px solid var(--score-5); }
.score-dot--6 { background: color-mix(in srgb, var(--score-6) 15%, transparent); color: var(--score-6); border: 1px solid var(--score-6); }

.final-score {
  font-size: 0.9rem;
  font-weight: 700;
  min-width: 2.5rem;
  text-align: center;
}

/* Score color classes */
.score-1 { color: var(--score-1); }
.score-2 { color: var(--score-2); }
.score-3 { color: var(--score-3); }
.score-4 { color: var(--score-4); }
.score-5 { color: var(--score-5); }
.score-6 { color: var(--score-6); }

.final-placeholder {
  font-size: 0.85rem;
  color: var(--c-text-muted);
  min-width: 2rem;
  text-align: center;
}

.toggle-icon { color: var(--c-text-muted); font-size: 0.85rem; }

/* Detail */
.row-detail {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--c-border-soft);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } }

.detail-section { display: flex; flex-direction: column; gap: 0.3rem; }

.detail-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--c-text-muted);
}

.detail-text {
  font-size: 0.85rem;
  color: var(--c-text);
  margin: 0;
  line-height: 1.6;
}

.expected {
  background: color-mix(in srgb, var(--c-vue) 6%, transparent);
  border-left: 2px solid var(--c-vue);
  padding: 0.5rem 0.75rem;
  border-radius: 0 6px 6px 0;
}

.hint-section .detail-text { color: var(--c-text-soft); font-style: italic; }

.code-block {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.6;
  color: var(--c-text-soft);
  overflow-x: auto;
  white-space: pre-wrap;
}

/* Scoring */
.scoring-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: var(--c-bg);
  border: 1px solid var(--c-border-soft);
  border-radius: 8px;
}

.score-buttons { display: flex; gap: 0.4rem; }

.score-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-hover);
  color: var(--c-text-soft);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.score-btn:hover:not(:disabled) { transform: translateY(-2px); }
.score-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Score button selected state */
.score-btn--selected.score-btn--1 { background: color-mix(in srgb, var(--score-1) 20%, transparent); border-color: var(--score-1); color: var(--score-1); }
.score-btn--selected.score-btn--2 { background: color-mix(in srgb, var(--score-2) 20%, transparent); border-color: var(--score-2); color: var(--score-2); }
.score-btn--selected.score-btn--3 { background: color-mix(in srgb, var(--score-3) 20%, transparent); border-color: var(--score-3); color: var(--score-3); }
.score-btn--selected.score-btn--4 { background: color-mix(in srgb, var(--score-4) 20%, transparent); border-color: var(--score-4); color: var(--score-4); }
.score-btn--selected.score-btn--5 { background: color-mix(in srgb, var(--score-5) 20%, transparent); border-color: var(--score-5); color: var(--score-5); }
.score-btn--selected.score-btn--6 { background: color-mix(in srgb, var(--score-6) 20%, transparent); border-color: var(--score-6); color: var(--score-6); }

/* Score button colors on hover */
.score-btn--1:hover { background: color-mix(in srgb, var(--score-1) 15%, transparent); border-color: var(--score-1); color: var(--score-1); }
.score-btn--2:hover { background: color-mix(in srgb, var(--score-2) 15%, transparent); border-color: var(--score-2); color: var(--score-2); }
.score-btn--3:hover { background: color-mix(in srgb, var(--score-3) 15%, transparent); border-color: var(--score-3); color: var(--score-3); }
.score-btn--4:hover { background: color-mix(in srgb, var(--score-4) 15%, transparent); border-color: var(--score-4); color: var(--score-4); }
.score-btn--5:hover { background: color-mix(in srgb, var(--score-5) 15%, transparent); border-color: var(--score-5); color: var(--score-5); }
.score-btn--6:hover { background: color-mix(in srgb, var(--score-6) 15%, transparent); border-color: var(--score-6); color: var(--score-6); }

.score-hint {
  font-size: 0.65rem;
  color: var(--c-text-muted);
  flex: 1;
}

.no-expert-warn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--c-warn);
  font-family: var(--font-mono);
}
</style>
