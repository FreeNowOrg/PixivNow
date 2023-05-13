import { defineStore } from 'pinia'
import { PixivUser } from '@/types'

export const useSideNavStore = defineStore('sidenav', () => {
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

export const useUserStore = defineStore('user', () => {
  const user = ref<PixivUser | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  const userId = computed(() => user.value?.id)
  const userName = computed(() => user.value?.name)
  const userPixivId = computed(() => user.value?.pixivId)
  const userProfileImg = computed(() => user.value?.profileImg)
  const userProfileImgBig = computed(() => user.value?.profileImgBig)
  function login(data: PixivUser) {
    user.value = data
  }
  function logout() {
    user.value = null
  }
  return {
    user,
    isLoggedIn,
    userId,
    userName,
    userPixivId,
    userProfileImg,
    userProfileImgBig,
    login,
    logout,
  }
})
