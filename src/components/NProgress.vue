<template lang="pug">
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

onMounted(() => {
  // 介入路由事件
  router.beforeEach(() => void nprogress.start())

  router.afterEach(() => void nprogress.done())

  // 介入 Axios 事件
  axios.interceptors.request.use((config) => {
    nprogress.start()
    return config
  })

  axios.interceptors.response.use(
    (res) => {
      nprogress.done()
      return res
    },
    (err) => {
      nprogress.done()
      return Promise.reject(err)
    }
  )
})
</script>

<style lang="sass">

#nprogress
  .bar
    background-color: var(--theme-secondary-color)
    top: 50px
    .peg
      display: none

  .spinner
    top: 60px

    .spinner-icon
      border-top-color: var(--theme-secondary-color)
      border-left-color: var(--theme-secondary-color)
</style>
