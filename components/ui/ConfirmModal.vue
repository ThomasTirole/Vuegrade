<script setup lang="ts">
// Modal de confirmation globale
// Utilise le composable useConfirm pour gérer l'état

const { state, handleConfirm, handleCancel } = useConfirm()

const iconName = computed(() => {
  if (state.options?.icon) return state.options.icon
  if (state.options?.confirmColor === 'red') return 'i-heroicons-exclamation-triangle'
  return 'i-heroicons-question-mark-circle'
})

const iconColorClass = computed(() => {
  switch (state.options?.confirmColor) {
    case 'red': return 'icon--danger'
    case 'orange': return 'icon--warning'
    case 'green': return 'icon--success'
    default: return 'icon--primary'
  }
})
</script>

<template>
  <UModal v-model="state.isOpen" :ui="{ width: 'sm:max-w-md' }">
    <div class="confirm-modal">
      <div class="confirm-header">
        <div class="confirm-icon" :class="iconColorClass">
          <UIcon :name="iconName" />
        </div>
        <h3 class="confirm-title">{{ state.options?.title }}</h3>
      </div>

      <p class="confirm-message">{{ state.options?.message }}</p>

      <div class="confirm-actions">
        <UButton
          variant="ghost"
          color="gray"
          @click="handleCancel"
        >
          {{ state.options?.cancelLabel || 'Annuler' }}
        </UButton>
        <UButton
          :color="state.options?.confirmColor || 'primary'"
          @click="handleConfirm"
        >
          {{ state.options?.confirmLabel || 'Confirmer' }}
        </UButton>
      </div>
    </div>
  </UModal>
</template>

<style scoped>
.confirm-modal {
  padding: 1.5rem;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.icon--primary {
  background: color-mix(in srgb, var(--c-nuxt) 15%, transparent);
  color: var(--c-nuxt);
}
.icon--danger {
  background: color-mix(in srgb, var(--c-error) 15%, transparent);
  color: var(--c-error);
}
.icon--warning {
  background: color-mix(in srgb, var(--c-warn) 15%, transparent);
  color: var(--c-warn);
}
.icon--success {
  background: color-mix(in srgb, var(--c-vue) 15%, transparent);
  color: var(--c-vue);
}

.confirm-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--c-text);
}

.confirm-message {
  font-size: 0.875rem;
  color: var(--c-text-soft);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
