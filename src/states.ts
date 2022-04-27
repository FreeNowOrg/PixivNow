import { defineStore } from 'pinia'

export const useStore = defineStore('sidenav', {
  state: () => ({ open: false }),
  getters: {
    isOpen(state) {
      return state.open
    },
  },
})
