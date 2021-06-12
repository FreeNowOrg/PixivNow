<template lang="pug">
footer.globalFooter
  p
    | &copy; Copyright {{ yearStr }}
    |
    a(href="https://github.com/Wjghj-Project/pixiv-now" target="_blank").
      Wjghj-Project/pixiv-now
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
  background-color: rgb(54, 151, 231)
  padding: 0.4rem
  font-size: 1rem
  color: #fff

  > a
    color: #fff
</style>
