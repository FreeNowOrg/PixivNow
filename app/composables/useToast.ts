// app/composables/useToast.ts
import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function addToast(message: string, type: ToastItem['type'], duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, duration)
}

export function useToast() {
  return {
    info: (msg: string) => addToast(msg, 'info'),
    success: (msg: string) => addToast(msg, 'success'),
    warning: (msg: string) => addToast(msg, 'warning'),
    error: (msg: string) => addToast(msg, 'error'),
  }
}

export function useToastState() {
  return { toasts }
}
