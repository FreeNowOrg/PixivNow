<template>
  <section class="home">
    <div class="title">
      <span class=""
        ><span class="left">Pixiv</span><span class="right">Now</span></span
      >
    </div>
    <p>Pixiv Service Proxy.</p>
    <p>
      前端<ruby>在做了<rt>咕咕咕</rt></ruby>
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
.title {
  font-size: 6rem;
  font-weight: bold;
}
.ph {
  display: inline-block;
  background-color: #252525;
  border-radius: 8px;
  padding: 0.4rem;
  user-select: none;
}
.ph .left,
.ph .right {
  display: inline-block;
  padding: 0.4rem;
  margin: 0.4rem;
}
.ph .left {
  color: #fff;
}
.ph .right {
  color: #000;
  background-color: rgb(54, 151, 231);
  border-radius: 8px;
}
</style>
