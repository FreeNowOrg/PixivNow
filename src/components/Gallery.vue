<template lang="pug">
.gallery
  img.picBig(:src="imgSrc" alt="")
  .pagenator
    button(@click="prevImg") ←
    input(v-model="imgCountInput" type="number")
    span.pageNow / {{ pages.length }}
    button(@click="nextImg") →
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['pages'],
  data() {
    return {
      imgCount: 0,
      imgCountInput: 1,
      imgSrc: '',
    }
  },
  methods: {
    setImg(count) {
      count = this.pages[count] ? count : 0
      this.imgSrc = 'https://blog.wjghj.cn/_statics/images/placeholder.svg'
      const url = `https://pixiv.wjghj.cn${this.pages[count].urls.original}`
      const img = new Image()
      img.src = url
      img.onload = () => {
        this.imgSrc = url
      }
    },
    prevImg() {
      this.imgCount--
    },
    nextImg() {
      this.imgCount++
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
.gallery
  text-align: center

.picBig
  max-width: 50vw
  max-height: 75vh
  width: auto
  height: auto
  transition: box-shadow 0.4s ease-in-out

  &:hover
    box-shadow: 0 0 8px var(--theme-box-shadow-color)

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
