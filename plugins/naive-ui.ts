import { setup } from '@css-render/vue3-ssr'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) {
    const { collect } = setup(nuxtApp.vueApp)
    const originalRenderMeta = nuxtApp.ssrContext?.renderMeta
    /** @ts-ignore */
    nuxtApp.ssrContext = nuxtApp.ssrContext ?? {}
    /** @ts-ignore */
    nuxtApp.ssrContext.renderMeta = () => {
      if (!originalRenderMeta) {
        return {
          headTags: collect(),
        }
      }
      const originalMeta = originalRenderMeta()
      if ('then' in originalMeta) {
        /** @ts-ignore */
        return originalMeta.then((resolvedOriginalMeta) => {
          return {
            ...resolvedOriginalMeta,
            headTags: resolvedOriginalMeta.headTags + collect(),
          }
        })
      } else {
        return {
          ...originalMeta,
          headTags: originalMeta.headTags + collect(),
        }
      }
    }
  }
})
