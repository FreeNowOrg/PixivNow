<template lang="pug">
side-nav(ref="globalSideNav")
site-header(ref="globalHeader")

main
  article
    router-view

site-footer(ref="globalFooter")

n-progress
</template>

<script lang="ts" setup>
import SiteHeader from './components/Header.vue'
import SiteFooter from './components/Footer.vue'
import SideNav from './components/SideNav/SideNav.vue'
import NProgress from './components/NProgress.vue'
import { existsSessionId, initUser } from './components/userData'
import { onMounted } from 'vue'
import { useUserStore } from './states'

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
