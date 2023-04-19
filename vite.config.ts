import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconResolver from 'unplugin-icons/resolver'

const PROD = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: true,
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        '@vueuse/core',
        { axios: [['default', 'axios']] },
      ],
      resolvers: [
        IconResolver({
          alias: {
            fas: 'fa-solid',
          },
        }),
      ],
    }),
    Icons({
      scale: 1,
      defaultClass: 'svg--inline',
    }),
  ],
  build: {},
  esbuild: {
    drop: PROD ? ['console'] : [],
  },
  server: { host: true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json'],
  },
})
