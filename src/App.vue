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

export default defineComponent({
  name: 'App',
  components: { Header, Footer, NProgress },
  data() {
    return {}
  },
  methods: {},
  mounted() {},
})
</script>

<style scoped lang="sass">
main
  article
    z-index: 1
    min-height: 100vh
    padding: 60px 1rem 100px 1rem
    box-sizing: border-box
    position: relative
</style>
