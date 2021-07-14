<template lang="pug">
.gallery
  ul.centerImg.align-center(:class="showAll ? 'showAll' : 'showSingle'")
    li(
      v-if="showAll"
      v-for="item in pages")
      a(
        :href="API_BASE + item.urls.original"
        target="_blank"
        title="点击下载原图")
        LazyLoad.pic(
          :src="API_BASE + item.urls.regular"
          :width="item.width"
          :height="item.height")
    li(
      v-if="!showAll")
      a(
        :href="API_BASE + pages[0].urls.original"
        target="_blank"
        title="点击下载原图"
        )
        LazyLoad.pic(
          :src="API_BASE + pages[0].urls.regular"
          :width="pages[0].width"
          :height="pages[0].height")
  .info.align-center
    .tips (这是预览图，点击下载原图)
    .showAllBtn
      a.button(
        v-if="pages.length > 1 && !showAll"
        @click="showAll = true"
        ) 查看全部 {{ pages.length }} 张
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
    }
  },
})
</script>

<style lang="sass">
.centerImg
  width: 100%
  overflow: auto
  margin: 0.4rem auto
  padding-left: 0
  display: flex
  flex-wrap: nowrap

  li
    display: inline-block
    margin: 0.2rem 0.4rem

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

[rol="img"]
  border-radius: 4px
  box-shadow: var(--theme-box-shadow)
  transition: box-shadow 0.24s ease-in-out

  &:hover
    box-shadow: var(--theme-box-shadow-hover)

.showSingle
  display: block
  text-align: center

  [rol="img"]
    max-width: 75vw
    max-height: 75vh
    width: auto
    height: auto

.showAll
  [rol="img"]
    height: 50vh
    width: auto

.imgProgress
  animation: imgProgress 0.6s ease infinite alternate

@media screen and(max-width: 800px)
  .picBig
    max-width: 100%

.pagenator
  margin-top: 1rem

  button
    cursor: pointer

  input, .pageNow
    text-align: center
    width: 3rem
    margin: 0 0.4rem

  input
    margin-right: 0
</style>
