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

  if (import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
    app.use(
      VueGtag,
      {
        config: { id: import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string },
      },
      router
    )
  }

  await loadLocaleMessages(i18n, initialLocale)
}
