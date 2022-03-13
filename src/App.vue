<template lang="pug">
SideNav(ref="globalSideNav")
Header(ref="globalHeader" @toggle-sidenav="toggleSideNav")

main
  article
    router-view

Footer(ref="globalFooter")

NProgress
</template>

<script lang="ts" setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import SideNav from './components/SideNav/SideNav.vue'
import NProgress from './components/NProgress.vue'
import { userInit } from './components/userData'
import { onMounted, ref } from 'vue'

const globalSideNav = ref<InstanceType<typeof SideNav> | null>(null)

function toggleSideNav(showSideNav: boolean): void {
  if (globalSideNav.value) {
    globalSideNav.value.show = showSideNav
  }
}
const name = ref('App')

onMounted(userInit)
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
