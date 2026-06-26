import { resolve } from 'node:path'
import Icons from 'unplugin-icons/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  ssr: false,

  modules: ['@pinia/nuxt', '@nuxtjs/i18n', '@vueuse/nuxt'],

  components: [
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
  ],

  css: ['~/assets/styles/index.scss'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Noto+Sans+SC:wght@400;700;900&display=swap',
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
      ],
    },
  },

  vite: {
    plugins: [
      Icons({
        scale: 1,
        defaultClass: 'svg--inline',
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "${resolve(import.meta.dirname, './app/assets/styles/_fnb.scss')}" as *;`,
        },
        sass: {
          additionalData: `\n@use "${resolve(import.meta.dirname, './app/assets/styles/_fnb.scss')}" as *\n`,
        },
      },
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
    langDir: '../app/locales',
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    uaBlacklist: process.env.UA_BLACKLIST || '[]',
    public: {
      pximgBaseUrlI: process.env.VITE_PXIMG_BASEURL_I || '/-/',
      pximgBaseUrlS: process.env.VITE_PXIMG_BASEURL_S || '/~/',
      googleAnalyticsId: process.env.VITE_GOOGLE_ANALYTICS_ID || '',
      disableSiteNotice: process.env.DISABLE_SITE_NOTICE || 'false',
      siteEnv:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
    },
  },

  devtools: { enabled: true },
})
