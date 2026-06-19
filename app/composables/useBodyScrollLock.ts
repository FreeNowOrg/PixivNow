import { watch, type Ref } from 'vue'

export function useBodyScrollLock(isLocked: Ref<boolean>) {
  watch(isLocked, (locked) => {
    document.body.style.overflow = locked ? 'hidden' : ''
  })

  onScopeDispose(() => {
    document.body.style.overflow = ''
  })
}
