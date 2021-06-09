<template>
  <header>
    <div class="globalNavbar">
      <div class="logo">PixivNow</div>
      |
      <router-link class="link" to="/">Home</router-link>
      ·
      <router-link class="link" to="/artworks">Artworks</router-link>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'com-header',
  setup() {},
})
</script>

<style scoped>
.globalNavbar {
  background-color: rgb(54, 151, 231);
  padding: 0.4rem;
  font-size: 2rem;
  color: #fff;
  display: flex;
}
.logo,
.link {
  margin: 0 0.4rem;
  text-decoration: none;
  color: #fff;
}
</style>
