<template>
  <h1>View artwork!</h1>
  <section>
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
}
</script>

<style></style>
