<template>
  <section class="home">
    <div class="title">
      <span class="">PixivNow</span>
    </div>
    <p class="description">Pixiv Service Proxy</p>
    <p>
      <ruby>前端在做了<rt>咕咕咕</rt></ruby>
    </p>
    <p>
      <router-link to="/artworks">Artworks</router-link>
      ·
      <a href="https://github.com/Wjghj-Project/pixiv-now" target="_blank"
        >Documentation</a
      >
    </p>
  </section>
</template>

<script lang="ts">
export default {
  setup() {
    document.title = 'PixivNow'
    return {
      name: 'view-index',
    }
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
