import { defineStore } from 'pinia'
import type { PixivUser } from '~/types'
import { pixivClient } from '~/api/pixiv-client'
import Cookies from 'js-cookie'

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

  async function initFromSession(): Promise<PixivUser> {
    try {
      const data = await pixivClient._getSessionUser()
      if (data.token) {
        Cookies.set('CSRFTOKEN', data.token, {
          secure: true,
          sameSite: 'Strict',
        })
        user.value = data.userData
        return data.userData
      } else {
        Cookies.remove('CSRFTOKEN')
        return Promise.reject('Invalid session ID')
      }
    } catch (err) {
      Cookies.remove('CSRFTOKEN')
      return Promise.reject(err)
    }
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
    initFromSession,
  }
})
