<template lang="pug">
h1 浏览作品

section
  h2 通过关键词查找
  search-box(class="mainpage")

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

<style scoped lang="scss">
.inputArea {
  input {
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-size: 1.4rem;
    border: 1px solid #888;
    border-radius: 4px;
    outline: none;
    padding: 0.2rem 0.5rem;
    color: #444;
  }

  button {
    padding: 0.4rem 1.2rem;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    background-color: rgb(54, 151, 231);
    color: #fff;
    display: block;
    margin: 1rem auto;
  }
}
</style>
