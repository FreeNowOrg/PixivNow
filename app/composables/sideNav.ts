import { defineStore } from 'pinia'

export const useSideNavStore = defineStore('sideNav', () => {
  const openState = ref(false)
  const isOpened = computed(() => openState.value)
  function toggle() {
    openState.value = !openState.value
  }
  function open() {
    openState.value = true
  }
  function close() {
    openState.value = false
  }
  return { openState, isOpened, toggle, open, close }
})
