import { PixivWebClient } from '~/api/pixiv-client'

let instance: PixivWebClient | null = null

export function usePixivClient(): PixivWebClient {
  if (!instance) {
    const runtimeConfig = useRuntimeConfig()
    instance = new PixivWebClient({
      pximgBaseUrlI: runtimeConfig.public.pximgBaseUrlI,
      pximgBaseUrlS: runtimeConfig.public.pximgBaseUrlS,
    })
  }
  return instance
}
