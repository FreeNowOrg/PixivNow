// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  ssr: false,

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    '@bg-dev/nuxt-naiveui',
    [
      'unplugin-icons/nuxt',
      {
        scale: 1,
        defaultClass: 'svg--inline',
      },
    ],
  ],

  css: ['~/assets/styles/index.sass'],

  vite: {
    optimizeDeps: {
      include: [
        'vue-gtag',
        'naive-ui',
        'nprogress',
        'js-cookie',
        'axios',
        'date-fns-tz',
        'gif.js',
        'modern-mp4',
        'vue-waterfall-plugin-next',
      ],
    },
  },

  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        plugins: ['@vue/language-plugin-pug'],
      },
    },
  },

  i18n: {
    locales: [{ code: 'zh-Hans', file: 'zh-Hans.json' }],
    defaultLocale: 'zh-Hans',
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    // Server-only (overridable via NUXT_UA_BLACKLIST or legacy UA_BLACKLIST)
    uaBlacklist: process.env.UA_BLACKLIST || '[]',
    public: {
      // Overridable via NUXT_PUBLIC_* or legacy VITE_* env vars
      pximgBaseUrlI: process.env.VITE_PXIMG_BASEURL_I || '/-/',
      pximgBaseUrlS: process.env.VITE_PXIMG_BASEURL_S || '/~/',
      googleAnalyticsId: process.env.VITE_GOOGLE_ANALYTICS_ID || '',
      siteEnv:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
    },
  },

  devtools: { enabled: true },
})
