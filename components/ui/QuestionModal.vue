<script setup lang="ts">
import type { Question } from '~/types'

const props = defineProps<{
  question: Question | null
  defaultType: 'theoretical' | 'practical'
}>()

const emit = defineEmits<{
  save: [payload: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>]
  update: [payload: Question]
  close: []
}>()

const isEdit = computed(() => !!props.question)

const form = reactive({
  type: props.question?.type ?? props.defaultType,
  ref: props.question?.ref ?? '',
  title: props.question?.title ?? '',
  question: props.question?.question ?? '',
  expectedAnswer: props.question?.expectedAnswer ?? '',
  hint: props.question?.hint ?? '',
  codeSnippet: props.question?.codeSnippet ?? '',
  codeLanguage: props.question?.codeLanguage ?? 'vue',
  tags: props.question?.tags?.join(', ') ?? '',
  studentId: props.question?.studentId ?? null,
})

function submit() {
  const payload = {
    type: form.type as Question['type'],
    ref: form.ref.trim(),
    title: form.title.trim(),
    question: form.question.trim(),
    expectedAnswer: form.expectedAnswer.trim(),
    hint: form.hint.trim() || undefined,
    codeSnippet: form.codeSnippet.trim() || undefined,
    codeLanguage: form.codeLanguage,
    tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    studentId: form.studentId,
  }

  if (isEdit.value && props.question) {
    emit('update', { ...props.question, ...payload })
  } else {
    emit('save', payload)
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            {{ isEdit ? 'Modifier la question' : 'Nouvelle question' }}
          </h2>
          <button class="close-btn" @click="$emit('close')">
            <UIcon name="i-heroicons-x-mark" />
          </button>
        </div>

        <form class="modal-form" @submit.prevent="submit">
          <!-- Type + Ref -->
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Type</label>
              <div class="type-selector">
                <button
                  type="button"
                  class="type-btn"
                  :class="{ 'type-btn--active type-btn--theory': form.type === 'theoretical' }"
                  @click="form.type = 'theoretical'"
                >
                  T — Théorique
                </button>
                <button
                  type="button"
                  class="type-btn"
                  :class="{ 'type-btn--active type-btn--practical': form.type === 'practical' }"
                  @click="form.type = 'practical'"
                >
                  P — Pratique
                </button>
              </div>
            </div>
            <div class="form-field form-field--sm">
              <label class="field-label">Référence <span class="muted">(ex: T-1, P-4)</span></label>
              <input v-model="form.ref" class="field-input mono" placeholder="T-1" required />
            </div>
          </div>

          <!-- Titre -->
          <div class="form-field">
            <label class="field-label">Titre court</label>
            <input v-model="form.title" class="field-input" placeholder="SFC — Single File Component" required />
          </div>

          <!-- Question -->
          <div class="form-field">
            <label class="field-label">Question complète</label>
            <textarea
              v-model="form.question"
              class="field-textarea"
              placeholder="Dans Vue.JS nous avons utilisé des SFC, qu'est-ce que cela signifie…"
              rows="3"
              required
            />
          </div>

          <!-- Réponse attendue -->
          <div class="form-field">
            <label class="field-label">Réponse attendue</label>
            <textarea
              v-model="form.expectedAnswer"
              class="field-textarea field-textarea--expected"
              placeholder="SFC = Single File Component. Fichier .vue regroupant template, script et style…"
              rows="3"
            />
          </div>

          <!-- Indice -->
          <div class="form-field">
            <label class="field-label">💡 Indice <span class="muted">(si l'élève bloque)</span></label>
            <textarea v-model="form.hint" class="field-textarea" rows="2" />
          </div>

          <!-- Code snippet (pratique uniquement) -->
          <div class="form-field" v-if="form.type === 'practical'">
            <label class="field-label">Extrait de code</label>
            <div class="code-input-wrapper">
              <select v-model="form.codeLanguage" class="lang-select mono">
                <option value="vue">Vue</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
              </select>
              <textarea
                v-model="form.codeSnippet"
                class="field-textarea field-textarea--code mono"
                placeholder="// Coller le code de référence ici…"
                rows="6"
              />
            </div>
          </div>

          <!-- Tags -->
          <div class="form-field">
            <label class="field-label">Tags <span class="muted">(séparés par des virgules)</span></label>
            <input v-model="form.tags" class="field-input mono" placeholder="pinia, composant, props" />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="$emit('close')">Annuler</button>
            <button type="submit" class="btn-save">
              <UIcon name="i-heroicons-check" />
              {{ isEdit ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </form>
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
  width: 100%; max-width: 680px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border);
}
.modal-title { font-size: 1rem; font-weight: 600; margin: 0; }
.close-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  background: transparent; border: none; color: var(--c-text-muted);
  cursor: pointer; transition: all 0.12s;
}
.close-btn:hover { background: var(--c-bg-hover); color: var(--c-text); }

.modal-form {
  padding: 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
}

.form-row { display: flex; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
.form-field--sm { max-width: 140px; }

.field-label {
  font-family: var(--font-mono); font-size: 0.7rem;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--c-text-muted);
}
.muted { text-transform: none; letter-spacing: 0; font-weight: 400; }

.field-input, .field-textarea {
  background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 0.5rem 0.75rem;
  color: var(--c-text); font-size: 0.875rem;
  font-family: var(--font-display);
  outline: none; transition: border-color 0.15s;
  resize: vertical;
}
.field-input:focus, .field-textarea:focus {
  border-color: color-mix(in srgb, var(--c-nuxt) 50%, transparent);
}
.field-textarea { min-height: 72px; }
.field-textarea--expected {
  border-left: 2px solid var(--c-vue);
  background: color-mix(in srgb, var(--c-vue) 4%, var(--c-bg));
}
.field-textarea--code { font-family: var(--font-mono); font-size: 0.8rem; }

.type-selector { display: flex; gap: 0.4rem; }
.type-btn {
  flex: 1; padding: 0.45rem 0.75rem;
  background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 8px; color: var(--c-text-soft);
  font-size: 0.8rem; font-family: var(--font-mono);
  cursor: pointer; transition: all 0.15s;
}
.type-btn:hover { border-color: var(--c-text-muted); color: var(--c-text); }
.type-btn--active.type-btn--theory {
  background: color-mix(in srgb, var(--c-info) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-info) 40%, transparent);
  color: var(--c-info);
}
.type-btn--active.type-btn--practical {
  background: color-mix(in srgb, var(--c-vue) 10%, transparent);
  border-color: color-mix(in srgb, var(--c-vue) 40%, transparent);
  color: var(--c-vue);
}

.code-input-wrapper { display: flex; flex-direction: column; gap: 0.4rem; }
.lang-select {
  width: fit-content; background: var(--c-bg); border: 1px solid var(--c-border);
  border-radius: 6px; padding: 0.3rem 0.6rem;
  color: var(--c-text-muted); font-size: 0.75rem; outline: none;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding-top: 0.5rem; border-top: 1px solid var(--c-border-soft);
  margin-top: 0.5rem;
}
.btn-cancel {
  padding: 0.5rem 1rem; border-radius: 8px;
  background: transparent; border: 1px solid var(--c-border);
  color: var(--c-text-soft); font-size: 0.875rem; cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { border-color: var(--c-text-muted); color: var(--c-text); }
.btn-save {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1.25rem; border-radius: 8px;
  background: var(--c-nuxt); border: none;
  color: #0d1117; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover { background: var(--c-nuxt-dim); }
</style>
