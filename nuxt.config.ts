// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    shim: false,
    tsConfig: {
      vueCompilerOptions: {
        plugins: ['@vue/language-plugin-pug'],
      },
    },
  },
  runtimeConfig: {
    public: {
      adsensePubId: '',
      googleAnalyticsId: '',
      googleSearchConsoleVerification: '',
      mode: '',
    },
  },
  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxtjs-naive-ui',
    'unplugin-icons/nuxt',
  ],
  i18n: {
    locales: [
      {
        code: 'zh-Hans',
        file: 'zh-Hans.json',
      },
    ],
    defaultLocale: 'zh-Hans',
  },
  routeRules: {
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
    '/u/**': {
      redirect: {
        to: '/users/**',
      },
    },
    '/i/**': {
      redirect: {
        to: '/artworks/**',
      },
    },
    '/-/**': {
      redirect: {
        to: 'https://i.pixiv.re/**',
      },
    },
    '/~/**': {
      proxy: {
        to: 'https://s.pximg.net/**',
      },
    },
  },
})
