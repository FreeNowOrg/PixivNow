import { createGtag } from 'vue-gtag'

const gtag = createGtag({
  tagId: useRuntimeConfig().public.googleAnalyticsId,
  pageTracker: {
    router: useRouter(),
  },
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(gtag)
})
