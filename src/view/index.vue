<template lang="pug">
.home
  .title
    span PixivNow
  p.description Pixiv Service Proxy
  search-box.big.search
  p
    ruby 前端在做了
      rt 咕咕咕
  p
    a(href="https://github.com/Wjghj-Project/pixiv-now", target="_blank") API Documentation
</template>

<script lang="ts">
import SearchBox from '../components/SearchBox.vue'

export default {
  components: {
    SearchBox,
  },
  mounted() {
    document.title = 'PixivNow'
  },
}
</script>

<style scoped lang="sass">
.home
  margin: 4rem auto
  height: 100%
  text-align: center

.description
  font-size: 1.2rem

.title
  font-size: 6rem
  font-weight: bold
  user-select: none

  > span
    box-shadow: 0 -0.5em 0 var(--theme-accent-color) inset
    text-shadow: 2px 2px var(--theme-text-shadow-color)
    padding: 0 0.4em

.search
  margin: 4rem 0
</style>
