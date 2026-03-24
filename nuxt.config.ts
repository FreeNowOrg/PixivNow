import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  ssr: false,

  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@vueuse/nuxt', 'nuxtjs-naive-ui'],

  css: ['~/assets/styles/index.sass'],

  vite: {
    plugins: [
      Icons({
        scale: 1,
        defaultClass: 'svg--inline',
      }),
      AutoImport({
        imports: [
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
    optimizeDeps: {
      include: [
        'vue-gtag',
        'naive-ui',
        'nprogress',
        'js-cookie',
        'axios',
        'date-fns-tz',
      ],
    },
    vue: {
      template: {
        compilerOptions: {},
      },
    },
  },

  i18n: {
    locales: [{ code: 'zh-Hans', file: 'zh-Hans.json' }],
    defaultLocale: 'zh-Hans',
    lazy: true,
    langDir: '../app/locales',
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    // Server-only (overridable via NUXT_UA_BLACKLIST or legacy UA_BLACKLIST)
    uaBlacklist: process.env.UA_BLACKLIST || '',
    public: {
      // Overridable via NUXT_PUBLIC_* or legacy VITE_* env vars
      pximgBaseUrlI: process.env.VITE_PXIMG_BASEURL_I || '/-/',
      pximgBaseUrlS: process.env.VITE_PXIMG_BASEURL_S || '/~/',
      googleAnalyticsId: process.env.VITE_GOOGLE_ANALYTICS_ID || '',
      siteEnv: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    },
  },

  devtools: { enabled: true },
})