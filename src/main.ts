import { createApp } from 'vue'
import { SITE_ENV } from './config'

// Create App
import App from './App.vue'
const app = createApp(App)

// Router
import { router } from './router'
app.use(router)

// FontAwesome
// https://fontawesome.com/v5.15/icons
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas)
app.component('fa', FontAwesomeIcon)

// Style
import './styles/index.sass'

// Mount
app.mount('#app')
document.body?.classList.add(
  SITE_ENV === 'development' ? 'env-development' : 'env-production'
)
