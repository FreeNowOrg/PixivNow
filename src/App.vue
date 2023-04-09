<template lang="pug">
side-nav
site-header

main
  article
    router-view

site-footer

n-progress
</template>

<script lang="ts" setup>
import SideNav from './components/SideNav/SideNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { existsSessionId, initUser } from '@/components/userData'
import { useUserStore } from '@/composables/states'

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

main
  padding-top: 50px
  position: relative
  flex: 1

  article
    background-color: rgba(0, 0, 0, 0.02)
    padding-bottom: 3rem
    z-index: 1
</style>
