<script setup lang="ts">
// Badge de difficulté d'une question (facile / moyenne / difficile)

import { DIFFICULTY_LABELS } from '~/types'
import type { QuestionDifficulty } from '~/types'

defineProps<{ difficulty?: QuestionDifficulty | null }>()
</script>

<template>
  <span v-if="difficulty" class="difficulty-badge mono" :class="`difficulty-badge--${difficulty}`">
    {{ DIFFICULTY_LABELS[difficulty] }}
  </span>
</template>

<style scoped>
/* ── Badge ─────────────────────────────────── */
.difficulty-badge {
  font-size: 0.65rem;
  padding: 1px 7px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid;
}

/* ── Niveaux ───────────────────────────────── */
.difficulty-badge--easy {
  color: var(--c-vue);
  background: color-mix(in srgb, var(--c-vue) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-vue) 30%, transparent);
}
.difficulty-badge--medium {
  color: var(--c-warn);
  background: color-mix(in srgb, var(--c-warn) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-warn) 30%, transparent);
}
.difficulty-badge--hard {
  color: var(--c-error);
  background: color-mix(in srgb, var(--c-error) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-error) 30%, transparent);
}
</style>
