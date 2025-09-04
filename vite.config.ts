import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

const PROD = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
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
      dirs: ['src/components/**', 'src/composables', 'src/utils', 'src/types'],
    }),
    Components({ dts: 'src/components.d.ts', resolvers: [NaiveUiResolver()] }),
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
