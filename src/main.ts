import { createApp } from 'vue'
import { SITE_ENV } from '@/config'
import { registerPlugins } from '@/plugins'
import App from './App.vue'
import '@/styles/index.sass'

// Create App
const app = createApp(App)

registerPlugins(app)

// Mount
app.mount('#app')
document.body?.setAttribute('data-env', SITE_ENV)
