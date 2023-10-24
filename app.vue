<template lang="pug">
#app-full-container(
  :data-env='ENV_MODE',
  :data-locale='routeLocale',
  :data-route='routeName'
)
  NuxtLayout
    NaiveuiProvider
      SiteHeader
      SideNavBody
      main: article: NuxtPage(tag='main')
      SiteFooter
      NProgress
</template>

<script lang="ts" setup>
import '~/assets/styles/index.sass'
useHead({
  titleTemplate(title) {
    return title ? `${title} | PixivNow` : 'PixivNow'
  },
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

const route = useRoute()
const routeName = computed(() => (route.name as string).split('___')[0])
const routeLocale = computed(
  () => (route.name as string)?.split('___')[1] ?? ''
)
const ENV_MODE = import.meta.env.MODE

onMounted(async () => {})
</script>

<style scoped lang="sass">
:deep(.n-config-provider)
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
