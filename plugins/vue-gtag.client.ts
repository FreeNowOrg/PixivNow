import VueGtag from 'vue-gtag'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    VueGtag,
    {
      config: {
        id: 'G-JN62ZN3RD5',
      },
    },
    useRouter()
  )
})
