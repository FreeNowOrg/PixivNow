// app/composables/useDialog.ts
import { ref } from 'vue'

export interface DialogOptions {
  title: string
  content: string
  positiveText?: string
  negativeText?: string
}

interface DialogState extends DialogOptions {
  resolve: (value: boolean) => void
}

const dialogState = ref<DialogState | null>(null)

export function useDialog() {
  return {
    open(options: DialogOptions): Promise<boolean> {
      return new Promise((resolve) => {
        dialogState.value = { ...options, resolve }
      })
    },
    close() {
      if (dialogState.value) {
        dialogState.value.resolve(false)
        dialogState.value = null
      }
    },
  }
}

export function useDialogState() {
  return {
    dialogState,
    confirm() {
      if (dialogState.value) {
        dialogState.value.resolve(true)
        dialogState.value = null
      }
    },
    cancel() {
      if (dialogState.value) {
        dialogState.value.resolve(false)
        dialogState.value = null
      }
    },
  }
}
