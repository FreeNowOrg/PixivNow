<template lang="pug">
NaiveuiProvider#app-full-container
  SiteNoticeBanner
  SiteHeader

  main
    article
      RouterView

  SideNav
  SiteFooter
  NProgress
</template>

<script lang="ts" setup>
import NaiveuiProvider from './components/NaiveuiProvider.vue'
import NProgress from './components/NProgress.vue'
import { existsSessionId, initUser } from '@/components/userData'
import { useUserStore } from '@/composables/states'

const SideNav = defineAsyncComponent(
  () => import('./components/SideNav/SideNav.vue')
)
const SiteFooter = defineAsyncComponent(
  () => import('./components/SiteFooter.vue')
)
const SiteHeader = defineAsyncComponent(
  () => import('./components/SiteHeader.vue')
)

const userStore = useUserStore()

onMounted(async () => {
  if (!existsSessionId()) {
    console.log('No session id found. Maybe you are not logged in?')
    userStore.logout()
    return
  }
  try {
    const userData = await initUser()
    userStore.login(userData)
  } catch (err) {
    console.error('User init failed:', err)
    userStore.logout()
  }
})
</script>

<style scoped lang="sass">
#app-full-container
  min-height: 100vh
  display: flex
  flex-direction: column

main
  // padding-top: 50px
  position: relative
  flex: 1
  article
    background-color: rgba(0, 0, 0, 0.02)
    padding-bottom: 3rem
    z-index: 1
</style>
