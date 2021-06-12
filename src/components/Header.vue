<template>
  <header>
    <div class="globalNavbar">
      <div class="logo">
        <span class="ph"
          ><span class="left">Pixiv</span><span class="right">Now</span></span
        >
      </div>
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

<style scoped lang="scss">
$base-color: #fff;
%logo-link-shared {
  margin: 0 0.4rem;
  text-decoration: none;
  color: $base-color;
}
%ph-left-right-shared {
  display: inline-block;
  padding: 0.1rem;
  margin: 0.1rem;
}
.globalNavbar {
  background-color: rgb(54, 151, 231);
  padding: 0.4rem;
  color: $base-color;
  display: flex;
  overflow-y: auto;
  align-items: center;
}
.logo {
  @extend %logo-link-shared;
  font-size: 1.2rem;
}
.link {
  @extend %logo-link-shared;
  font-variant: small-caps;
}
.ph {
  display: inline-block;
  background-color: #252525;
  border-radius: 4px;
  padding: 0.2rem;
  user-select: none;

  .left {
    @extend %ph-left-right-shared;
    color: $base-color;
  }

  .right {
    @extend %ph-left-right-shared;
    background-color: rgb(54, 151, 231);
    border-radius: 2px;
  }
}
</style>
