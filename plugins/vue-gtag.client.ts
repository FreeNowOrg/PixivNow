import VueGtag from 'vue-gtag'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
    nuxtApp.vueApp.use(
      VueGtag,
      {
        config: {
          id: import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string,
        },
      },
      useRouter()
    )
  }
})
