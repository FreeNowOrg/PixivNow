// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    shim: false,
  },
  runtimeConfig: {
    public: {
      adsensePubId: '',
      googleAnalyticsId: '',
      googleSearchConsoleVerification: '',
    },
  },
  build: {
    transpile:
      process.env.NODE_ENV === 'production'
        ? [
            'naive-ui',
            'vueuc',
            '@css-render/vue3-ssr',
            '@juggle/resize-observer',
          ]
        : ['@juggle/resize-observer'],
  },
  vite: {
    optimizeDeps: {
      include:
        process.env.NODE_ENV === 'development'
          ? ['naive-ui', 'vueuc', 'date-fns-tz/formatInTimeZone']
          : [],
    },
  },
  modules: [
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@pinia/nuxt',
    'unplugin-icons/nuxt',
  ],
  i18n: {
    locales: [
      {
        code: 'zh-Hans',
        file: 'zh-Hans.json',
      },
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'zh-Hans',
  },
  routeRules: {
    '/~/**': { proxy: '/api/image/**' },
    '/-/**': { proxy: 'https://pximg.wjghj.cn/**' },
    '/rpc_group_settings.php': {
      proxy: {
        to: 'https://www.pixiv.net/rpc_group_settings.php',
        cookieDomainRewrite: {
          '.pixiv.net': '',
        },
      },
    },
    '/bookmark_add.php': {
      proxy: {
        to: 'https://www.pixiv.net/bookmark_add.php',
        cookieDomainRewrite: {
          '.pixiv.net': '',
        },
      },
    },
  },
})
