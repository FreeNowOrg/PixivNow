<template lang="pug"></template>

<script lang="ts" setup>
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

const router = useRouter()

onMounted(() => {
  // 介入路由事件
  router.beforeEach(() => void nprogress.start())

  router.afterEach(() => void nprogress.done())
})
</script>

<style lang="sass">

#nprogress
  .bar
    background-color: var(--fnb-accent)
    top: 50px
    .peg
      display: none

  .spinner
    top: 60px

    .spinner-icon
      border-top-color: var(--fnb-accent)
      border-left-color: var(--fnb-accent)
</style>
