<template>
  <section class="home">
    <div class="title">PixivNow</div>
    <p>Pixiv Service Proxy.</p>
    <p>
      →
      <a href="https://github.com/Wjghj-Project/pixiv-now">Documentation</a>
      ←
    </p>
    <p>
      前端<ruby>在做了<rt>咕咕咕</rt></ruby>
    </p>
  </section>
</template>

<script lang="ts">
export default {
  setup() {
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
</style>
