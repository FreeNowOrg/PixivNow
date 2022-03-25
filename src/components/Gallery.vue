<template lang="pug">
.gallery
  .center-img(:class='showAll ? "show-all" : "show-single"')
    div(v-for='(item, index) in pages', :data-pic-index='index')
      a.image-container(
        v-if='picShow === index',
        :href='API_BASE + item.urls.original',
        target='_blank',
        title='点击下载原图'
      )
        lazy-load.img(
          :src='API_BASE + item.urls.regular',
          :width='item.width',
          :height='item.height'
          lazyload
        )
  //- .tips.align-center (这是预览图，点击下载原图)
  ul.pagenator(v-if='pages.length > 1')
    li(v-for='(item, index) in pages')
      a(
        @click='picShow = index',
        :title='"第" + (index + 1) + "张，共" + pages.length + "张"',
        :class='{ active: picShow === index }'
      )
        lazyload.pic(
          :src='API_BASE + item.urls.mini',
          :width='80',
          :height='80'
          lazyload
        )
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { API_BASE } from '../config'
import type { ArtworkUrls } from '../types'
import LazyLoad from './LazyLoad.vue'

const props = defineProps<{
  pages: {
    urls: ArtworkUrls
    width: number
    height: number
  }[]
}>()
const showAll = ref(false)
const picShow = ref(0)
</script>

<style lang="sass">

.gallery
  .center-img
    width: 100%
    overflow: auto
    margin: 0.4rem auto
    padding: 0.2rem
    display: flex
    flex-wrap: nowrap
    gap: 1rem

    li
      display: inline-block
      // margin: 0.2rem 0
      // gap: 1rem

  .flex-center
    gap: 1rem

    .left-btn,
    .right-btn
      flex: 1

    .left-btn
      text-align: right

  .tips
    font-size: small
    font-style: italic

  [role="img"]
    border-radius: 4px
    box-shadow: var(--theme-box-shadow)
    transition: box-shadow 0.24s ease-in-out

    &:hover
      box-shadow: var(--theme-box-shadow-hover)

  .center-img
    display: block
    text-align: center

    [role="img"]
      max-width: 100%
      max-height: 60vh
      width: auto
      height: auto

  .pagenator
    list-style: none
    margin: 0
    padding: 0.2rem
    white-space: nowrap
    overflow-y: auto
    text-align: center

    li
      margin: 0.5rem
      display: inline-block
</style>
