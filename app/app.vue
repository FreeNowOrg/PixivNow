<template lang="pug">
#app-full-container(
  :data-env='config.public.mode',
  :data-locale='routeLocale',
  :data-route='routeName'
)
  NuxtLayout
    NaiveuiProvider
      LazySiteHeader
      LazySideNavBody
      main: article: NuxtPage(tag='main')
      LazySiteFooter
      NProgress
</template>

<script lang="ts" setup>
import '~/assets/styles/index.sass'
const config = useRuntimeConfig()
useHead({
  meta: [
    {
      name: 'google-site-verification',
      content: config.public.googleSearchConsoleVerification,
    },
  ],
  script: [
    {
      async: true,
      src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.public.adsensePubId}`,
      crossorigin: 'anonymous',
    },
  ],
  titleTemplate(title) {
    return title ? `${title} | PixivNow` : 'PixivNow'
  },
})

const route = useRoute()
const routeName = computed(() => (route.name as string).split('___')[0])
const routeLocale = computed(
  () => (route.name as string)?.split('___')[1] ?? ''
)

const user = useUserStore()

onMounted(async () => {
  user.initUser()
})
</script>

<style scoped lang="sass">
:deep(.n-config-provider)
  min-height: 100vh
  display: flex
  flex-direction: column

main
  // padding-top: 50px
  position: relative
  flex: 1
  article
    background-color: rgb(0 0 0 / 0.02)
    padding-bottom: 3rem
    z-index: 1
</style>
