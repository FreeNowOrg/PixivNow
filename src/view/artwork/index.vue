<template>
  <h1>View artwork!</h1>
  <section class="searchBox">
    <input v-model="artId" type="number" />
    <button @click="gotoArt">查看</button>
  </section>
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

<style scoped lang="scss">
.searchBox {
  margin: 8rem auto;

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
