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
  color: #fff;
  display: flex;
  overflow-y: auto;
  align-items: center;
}
.logo {
  font-size: 2rem;
}
.logo,
.link {
  margin: 0 0.4rem;
  text-decoration: none;
  color: #fff;
}
.link {
  font-variant: small-caps;
}
</style>
