<template lang="pug">
.gallery
  .flex-center
    .leftBtn
      a(@click="prevImg")
        fa(icon="chevron-left" size="4x")
    .centerImg
      a(:href="API_BASE + originalSrc" target="_blank" title="点击下载原图")
        img.picBig(:src="imgSrc" alt="" v-if="!loading")
        svg.imgProgress.picBig(v-if="loading" :width="width" :height="height")
        .error.picBig(v-if="error" :width="width" :height="height") {{ error }}
      .tips.align-center {{ loading ? '(图片正在加载~)' : '(这是预览图，点击下载原图)' }}
    .rightBtn
      a(@click="nextImg")
        fa(icon="chevron-right" size="4x")
  .pagenator.align-center
    input(v-model="imgCountInput" type="number")
    span.pageNow / {{ pages.length }}
</template>

<script>
import { defineComponent } from 'vue'
import { API_BASE } from '../config'

import placeholder from './Placeholder.vue'

export default defineComponent({
  components: { placeholder },
  props: ['pages'],
  data() {
    return {
      API_BASE,
      imgCount: 0,
      imgCountInput: 1,
      imgSrc: '',
      originalSrc: '',
      loading: false,
      error: '',
      width: 0,
      height: 0,
    }
  },
  methods: {
    setImg(count) {
      count = this.pages[count] ? count : 0
      const item = this.pages[count]

      this.error = ''
      this.loading = true
      this.width = item.width
      this.height = item.height

      this.originalSrc = item.urls.original
      const url = `${API_BASE}${item.urls.regular}`

      const img = new Image()
      img.src = url
      img.onload = () => {
        this.imgSrc = url
        this.loading = false
      }
      img.onerror = (err) => {
        console.warn('Image load error', err)
        this.error = '坏耶，图片加载失败！'
        this.loading = false
      }
    },
    prevImg() {
      if (this.imgCount - 1 >= 1) this.imgCount--
    },
    nextImg() {
      if (this.imgCount + 1 <= this.pages.length) this.imgCount++
    },
  },
  watch: {
    imgCount(val) {
      this.imgCount = Math.max(0, this.imgCount)
      this.imgCount = Math.min(this.pages.length - 1, this.imgCount)
      // if (val < 0 || val + 1 > this.pages.length) this.imgCount = 0
      this.imgCountInput = val + 1
      this.setImg(this.imgCount)
    },
    imgCountInput(val) {
      this.imgCount = val - 1
    },
  },
  created() {
    this.setImg(0)
  },
})
</script>

<style scoped lang="sass">
.flex-center
  gap: 1rem

  .leftBtn,
  .rightBtn
    flex: 1

  .centerImg
    flex: 2

  .leftBtn
    text-align: right

.tips
  font-size: small
  font-style: italic

.picBig
  max-width: 50vw
  max-height: 75vh
  width: auto
  height: auto
  border-radius: 4px
  box-shadow: var(--theme-box-shadow)
  transition: box-shadow 0.24s ease-in-out

  &:hover
    box-shadow: var(--theme-box-shadow-hover)

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
