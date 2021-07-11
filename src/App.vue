<template lang="pug">
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
import NProgress from './components/NProgress.vue'
import { userInit } from './components/userData'

export default defineComponent({
  name: 'App',
  components: { Header, Footer, NProgress },
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
  padding: 24px 0 60px 0
  min-height: 100vh
  position: relative

  article
    padding: 1rem
    background-color: rgba(0, 0, 0, 0.02)
    z-index: 1
</style>
