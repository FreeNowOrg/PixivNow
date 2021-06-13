<template lang="pug">
h1 输入作品 ID 查看！
.searchBox
  input(v-model="artId", type="number")
  button(@click="gotoArt") 查看
p (我不知道怎么让内容撑满屏幕，太丑了……)
</template>

<script lang="ts">
import { router } from '../../router'
export default {
  data() {
    return {
      artId: 89719747,
    }
  },
  methods: {
    gotoArt() {
      router.push(`/artworks/${this.artId}`)
    },
  },
  watch: {
    artId(val) {
      if (val < 1) this.artId = 1
    },
  },
  mounted() {
    document.title = 'Artwork | PixivNow'
  },
}
</script>

<style scoped lang="sass">
.searchBox
  margin: 8rem auto

  input
    display: block
    width: 100%
    box-sizing: border-box
    font-size: 1.4rem
    border: 1px solid var(--theme-border-color)
    border-radius: 4px
    outline: none
    padding: 0.2rem 0.5rem
    color: #444

  button
    cursor: pointer
    padding: 0.4rem 1.2rem
    font-size: 1rem
    border: none
    border-radius: 4px
    background-color: var(--theme-accent-color)
    color: var(--theme-accent-link-color)
    display: block
    margin: 1rem auto
</style>
