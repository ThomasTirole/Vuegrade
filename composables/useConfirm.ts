// composables/useConfirm.ts
// Gère les modales de confirmation avec Promise

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'red' | 'green' | 'orange'
  icon?: string
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  isOpen: false,
  options: null,
  resolve: null,
})

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state.options = options
      state.resolve = resolve
      state.isOpen = true
    })
  }

  const handleConfirm = () => {
    state.resolve?.(true)
    state.isOpen = false
    state.options = null
    state.resolve = null
  }

  const handleCancel = () => {
    state.resolve?.(false)
    state.isOpen = false
    state.options = null
    state.resolve = null
  }

  return {
    state: readonly(state),
    confirm,
    handleConfirm,
    handleCancel,
  }
}
