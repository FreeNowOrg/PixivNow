<template lang="pug">
div#app-full-container
  NuxtLayout
    NaiveuiProvider
      SiteHeader
      SideNavBody
      NuxtPage
      SiteFooter
      NProgress
</template>

<script lang="ts" setup>
import '~/assets/styles/index.sass'
useHead({
  titleTemplate(title) {
    return title ? `${title} | PixivNow` : 'PixivNow'
  }
})


const SideNavBody = defineAsyncComponent(
  () => import('~/components/SideNav/Body.vue')
)
const SiteFooter = defineAsyncComponent(
  () => import('~/components/SiteFooter.vue')
)
const SiteHeader = defineAsyncComponent(
  () => import('~/components/SiteHeader.vue')
)

const userStore = useUserStore()

onMounted(async () => { })
</script>

<style scoped lang="sass">
#app-full-container
  min-height: 100vh
  display: flex
  flex-direction: column

main
  padding-top: 50px
  position: relative
  flex: 1
  article
    background-color: rgb(0 0 0 / 0.02)
    padding-bottom: 3rem
    z-index: 1
</style>
