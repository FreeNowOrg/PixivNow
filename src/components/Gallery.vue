<template lang="pug">
.gallery
  .centerImg(:class="showAll ? 'showAll' : 'showSingle'")
    div(
      v-for="(item, index) in pages"
      :data-pic-index="index"
      )
      a.container(
        v-if="picShow === index"
        :href="API_BASE + item.urls.original"
        target="_blank"
        title="点击下载原图")
        LazyLoad.pic(
          :src="API_BASE + item.urls.regular"
          :width="item.width"
          :height="item.height")
  .tips.align-center (这是预览图，点击下载原图)
  ul.pagenator
    li(v-for="(item, index) in pages")
      a(
        @click="picShow = index"
        :title="'第' + (index + 1) + '张 (共' + pages.length + '张)'"
        :class="{isActive: picShow === index}"
        )
        LazyLoad.pic(
          :src="API_BASE + item.urls.thumb_mini"
          :width="80"
          :height="80")
</template>

<script>
import { defineComponent } from 'vue'
import { API_BASE } from '../config'

import LazyLoad from './LazyLoad.vue'

export default defineComponent({
  components: { LazyLoad },
  props: ['pages'],
  data() {
    return {
      API_BASE,
      loading: false,
      error: '',
      showAll: false,
      picShow: 0,
    }
  },
})
</script>

<style lang="sass">
.gallery
  .centerImg
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

    .leftBtn,
    .rightBtn
      flex: 1

    .leftBtn
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

  .centerImg
    display: block
    text-align: center

    .container
      // height: 60vh

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
