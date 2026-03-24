import { createGtag } from 'vue-gtag'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const gaId = config.public.googleAnalyticsId as string

  if (gaId) {
    const router = useRouter()
    nuxtApp.vueApp.use(
      createGtag({
        tagId: gaId,
        pageTracker: {
          router,
        },
      })
    )
  }
})
