<template lang="pug">
ul.artworksList
  artwork-card(v-for="item in list" :illust="item")
</template>

<script lang="ts">
import ArtworkCard from './ArtworkCard.vue'

export default {
  props: ['list'],
  components: {
    ArtworkCard,
  },
}
</script>

<style lang="sass">
.artworksList
  display: flex
  flex-wrap: wrap
</style>
