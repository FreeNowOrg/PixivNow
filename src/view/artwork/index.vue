<template lang="pug">
h1 浏览作品

section
  h2 通过关键词查找
  search-box(class="big")

section
  h2 通过作品 ID 查看
  .inputArea
    input(v-model="artId" type="number" @keyup.enter="gotoArt")
    //- button(@click="gotoArt") 查看

</template>

<script lang="ts">
import { router } from '../../router'

import SearchBox from '../../components/SearchBox.vue'

export default {
  components: { SearchBox },
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
.inputArea
  input
    box-sizing: border-box
    font-size: 1.4rem
    border: 1px solid var(--theme-border-color)
    border-radius: 4px
    outline: none
    padding: 0.2em 0.6em
    color: #444
    height: 3rem
    background-color: whitesmoke
    width: 100%
    transition: all 0.12s ease-in-out

    &:focus
      background-color: var(--theme-background-color)

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
