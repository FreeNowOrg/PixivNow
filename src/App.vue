<template lang="pug">
side-nav(ref="globalSideNav" @update-show="updateShow")
site-header(ref="globalHeader" @toggle-sidenav="toggleSideNav")

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
import { userInit } from './components/userData'
import { onMounted, ref } from 'vue'

const globalSideNav = ref<InstanceType<typeof SideNav> | null>(null)
const globalHeader = ref<InstanceType<typeof SiteHeader> | null>(null)

function toggleSideNav(showSideNav: boolean): void {
  if (globalSideNav.value) {
    globalSideNav.value.show = showSideNav
  }
}

function updateShow(isShown: boolean): void {
  if (globalHeader.value) {
    globalHeader.value.sideNavShow = isShown
  }
}

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
