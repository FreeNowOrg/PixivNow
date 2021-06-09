<template>
  <div class="gallery">
    <img class="picBig" :src="imgSrc" alt="" />
    <div class="pagenator">
      <button @click="prevImg">←</button>
      <!-- <input v-model="imgCountInput" type="number" /> -->
      <span class="pageNow">{{ imgCountInput }} / {{ pages.length }}</span>
      <button @click="nextImg">→</button>
    </div>
  </div>
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
      const url = 'https://pixiv.wjghj.cn' + this.pages[count].urls.original
      const img = new Image()
      this.imgSrc = 'https://blog.wjghj.cn/_statics/images/placeholder.svg'
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
      if (val < 0) this.imgCount = 0
      if (val + 1 > this.pages.length) this.imgCount = this.pages.length - 1
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

<style scoped>
.gallery {
  text-align: center;
}
.picBig {
  max-width: 50vw;
  max-height: 75vh;
  width: auto;
  height: auto;
  transition: box-shadow 0.4s;
}
.picBig:hover {
  box-shadow: 0 0 4px #888;
}
.pagenator {
  margin-top: 1rem;
}
.pagenator input,
.pagenator .pageNow {
  text-align: center;
  width: 3rem;
  margin: 0 0.4rem;
}
</style>
