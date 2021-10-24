<template lang="pug">
SideNav
Header(ref="globalHeader")

main
  article
    router-view

Footer(ref="globalFooter")

NProgress
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import SideNav from './components/SideNav/SideNav.vue'
import NProgress from './components/NProgress.vue'
import { userInit } from './components/userData'

export default defineComponent({
  name: 'App',
  components: { Header, SideNav, Footer, NProgress },
  data() {
    return {}
  },
  methods: {},
  mounted() {
    userInit()
  },
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
