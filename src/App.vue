<template lang="pug">
Header(ref="globalHeader")
main(:style="{ minHeight: mainHeight + 'px' }")
  article
    router-view
Footer(ref="globalFooter")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

export default defineComponent({
  name: 'App',
  components: { Header, Footer },
  data() {
    return {
      mainHeight: 0,
    }
  },
  methods: {
    resizeMain() {
      // const navHeight = this.$refs.globalHeader.$el.offsetHeight
      // const footerHeight = this.$refs.globalFooter.$el.offsetHeight
      // const clientHeight = window.screen.availHeight
      // console.log({ navHeight, footerHeight, clientHeight })
      // this.mainHeight = clientHeight - navHeight - footerHeight
    },
  },
  mounted() {
    this.resizeMain()
    window.addEventListener('resize', this.resizeMain)
  },
})
</script>

<style scoped lang="sass">
main
  article
    z-index: 1
    min-height: 100vh
    padding: 50px 1rem 100px 1rem
    box-sizing: border-box
    position: relative
</style>
