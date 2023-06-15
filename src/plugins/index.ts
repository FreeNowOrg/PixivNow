import { router } from './router'
import { loadLocaleMessages, setupI18n } from './i18n'
import { createPinia } from 'pinia'
import VueGtag from 'vue-gtag'
import type { App } from 'vue'

export async function registerPlugins(app: App) {
  const i18n = setupI18n()
  const initialLocale = 'zh-Hans'
  app.use(i18n)
  app.use(router)
  app.use(createPinia())
  app.use(
    VueGtag,
    {
      config: { id: 'G-JN62ZN3RD5' },
    },
    router
  )

  await loadLocaleMessages(i18n, initialLocale)
}
