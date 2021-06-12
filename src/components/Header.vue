<template lang="pug">
header
  .globalNavbar
    .logo: span.ph
      .left Pixiv
      .right Now
    .
      |
    router-link.link(to="/") Home
    .
      .
    router-link.link(to="/artworks") Artworks
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'com-header',
  setup() {},
})
</script>

<style scoped lang="sass">
%logo-link-shared
  margin: 0 0.4rem
  text-decoration: none
  color: var(--theme-background-color)

%ph-left-right-shared
  display: inline-block
  padding: 0.1rem
  margin: 0.1rem

.globalNavbar
  background-color: var(--theme-accent-color)
  padding: 0.4rem
  color: var(--theme-background-color)
  display: flex
  overflow-y: auto
  align-items: center

.logo
  @extend %logo-link-shared
  font-size: 1.2rem

.link
  @extend %logo-link-shared
  font-variant: small-caps

.ph
  display: inline-block
  background-color: #252525
  border-radius: 4px
  padding: 0.2rem
  user-select: none

  .left
    @extend %ph-left-right-shared
    color: var(--theme-background-color)

  .right
    @extend %ph-left-right-shared
    background-color: rgb(54, 151, 231)
    border-radius: 2px
</style>
