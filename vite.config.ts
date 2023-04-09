import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

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
        { axios: [['default', 'axios']] },
      ],
    }),
    Icons({
      scale: 1,
      defaultClass: 'svg--inline',
    }),
    Components({
      dts: true,
      resolvers: [IconsResolver()],
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
