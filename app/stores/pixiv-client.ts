import { PixivWebClient } from '~/api/pixiv-client'

export const usePixivClientStore = defineStore('pixiv-client', () => {
  const runtimeConfig = useRuntimeConfig()
  const client = markRaw(
    new PixivWebClient({
      pximgBaseUrlI: runtimeConfig.public.pximgBaseUrlI,
      pximgBaseUrlS: runtimeConfig.public.pximgBaseUrlS,
    })
  )
  return { client }
})
