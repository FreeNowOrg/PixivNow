import { defineStore } from 'pinia'
import { PixivUser } from './components/userData'

export const useSideNavStore = defineStore('sidenav', {
  state: () => ({ open: false }),
  getters: {
    isOpen(state) {
      return state.open
    },
  },
})

export const useUserStore = defineStore('user', {
  state: () => {
    return { user: null } as { user: PixivUser | null }
  },
  getters: {
    isLoggedIn(state) {
      return !!state.user
    },
    userId(state) {
      return state.user?.id
    },
    userName(state) {
      return state.user?.name
    },
    userPixivId(state) {
      return state.user?.pixivId
    },
    userProfileImg(state) {
      return state.user?.profileImg
    },
    userProfileImgBig(state) {
      return state.user?.profileImgBig
    },
  },
  actions: {
    login(userData: PixivUser) {
      this.user = userData
    },
    logout() {
      this.user = null
    },
  },
})
