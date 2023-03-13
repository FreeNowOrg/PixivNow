import router from './router'
import { createPinia } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { App } from 'vue'
import ExternalLink from '@/components/ExternalLink.vue'
import Lazyload from '@/components/LazyLoad.vue'
import { setupAxios } from './axios'

export function registerPlugins(app: App) {
  app.use(router)
  app.use(createPinia())
  setupAxios()
}

export function addComponents(app: App) {
  app.component('lazyload', Lazyload)
  app.component('external-link', ExternalLink)
  library.add(fas)
  app.component('fa', FontAwesomeIcon)
}

export { useSideNavStore, useUserStore } from './states'
