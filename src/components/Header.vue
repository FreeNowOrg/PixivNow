<template lang="pug">
header.globalNavbar(:class="{ notAtTop, isHide }")
  .logoArea
    .logo: span.ph
      .left Pixiv
      .right Now
  .mainLinksArea
    router-link(to="/") Home
    | ·
    router-link(to="/artworks") Artworks
    | ·
    router-link(to="/about") About
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
  data() {
    return {
      notAtTop: false,
      isHide: false,
    }
  },
  mounted() {
    let scrollTop = document.documentElement.scrollTop
    window.addEventListener('scroll', () => {
      const newTop = document.documentElement.scrollTop

      if (scrollTop > 600) {
        this.isHide = newTop - scrollTop > 0
      } else {
        this.isHide = false
      }

      scrollTop = newTop

      if (newTop > 0) {
        this.notAtTop = true
      } else {
        this.notAtTop = false
      }
    })
  },
})
</script>

<style scoped lang="sass">
%logo-link-shared
  margin: 0 0.4rem
  text-decoration: none
  --color: var(--theme-accent-link-color)

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
  position: fixed
  width: 100%
  box-sizing: border-box
  white-space: nowrap
  top: 0
  z-index: 10
  transition: all .8s ease

  &.notAtTop
    box-shadow: 0 2px 4px var(--theme-box-shadow-color)

  &.isHide
    top: -80px

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
  white-space: nowrap

  .left
    @extend %ph-left-right-shared
    color: var(--theme-accent-link-color)

  .right
    @extend %ph-left-right-shared
    background-color: var(--theme-accent-color)
    border-radius: 2px
</style>
