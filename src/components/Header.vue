<template lang="pug">
header.globalNavbar
  .logoArea
    .logo: span.ph
      .left Pixiv
      .right Now
  .mainLinksArea
    router-link(to="/") Home
    .
      ·
    router-link(to="/artworks") Artworks
  .searchArea
    search-box
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBox from './SearchBox.vue'

export default defineComponent({
  name: 'com-header',
  components: {
    SearchBox,
  },
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

.logoArea
  // word-break:

.logo
  @extend %logo-link-shared
  font-size: 1.2rem

.mainLinksArea
  flex: 1

  a
    @extend %logo-link-shared
    font-variant: small-caps
    font-size: 1.2rem

.searchArea
  // flex: 1

.ph
  display: inline-block
  background-color: #252525
  border-radius: 4px
  padding: 0.2rem
  user-select: none

  .left
    @extend %ph-left-right-shared
    color: var(--theme-accent-link-color)

  .right
    @extend %ph-left-right-shared
    background-color: var(--theme-accent-color)
    border-radius: 2px
</style>
