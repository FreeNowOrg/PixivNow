import { createApp } from 'vue'
import { SITE_ENV } from '@/config'
import { addComponents, registerPlugins } from '@/plugins'
import '@/styles/index.sass'

// Create App
import App from './App.vue'
const app = createApp(App)

registerPlugins(app)
addComponents(app)

// Mount
app.mount('#app')
document.body?.setAttribute('data-env', SITE_ENV)
