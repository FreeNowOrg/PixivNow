<template lang="pug">
.home
  .title
    span PixivNow
  p.description Pixiv Service Proxy
  search-box(class="mainpage")
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

<style scoped>
.home {
  margin: 10rem auto;
  height: 100%;
  text-align: center;
}
.description {
  font-size: 1.2rem;
}
.title {
  font-size: 6rem;
  font-weight: bold;
  user-select: none;
}
.title > span {
  box-shadow: 0 -0.5em 0 rgb(54, 151, 231) inset;
  text-shadow: 2px 2px #fff;
  padding: 0 0.4em;
}
</style>
