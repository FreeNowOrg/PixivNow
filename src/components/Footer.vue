<template lang="pug">
footer.globalFooter
  p
    | &copy; Copyright {{ yearStr }}
    |
    a(href="https://github.com/PixivNow/PixivNow" target="_blank").
      PixivNow
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'comp-footer',
  setup() {
    const year = new Date().getFullYear()
    return {
      yearStr: 2021 === year ? year : `(2021 - ${year})`,
    }
  },
})
</script>
<style scoped lang="sass">
.globalFooter
  background-color: var(--theme-accent-color)
  padding: 0.4rem 1rem
  font-size: 1rem
  color: #fff
  position: absolute
  width: 100%
  box-sizing: border-box
  bottom: 0
  z-index: 10

  a
    color: #fff
    text-decoration: underline
</style>
