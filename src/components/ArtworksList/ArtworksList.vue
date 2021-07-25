<template lang="pug">
ul.artworksList
  li(v-for="item in list")
    artwork-card(v-if="item" :illust="item")
  li 
    slot/
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
  padding-left: 0
  list-style: none
  gap: 1.5rem
  justify-content: space-around

  &.inline
    padding: 1rem
    flex-wrap: nowrap
    overflow-y: auto

    .illustCard
      height: 500px
      // overflow-x: auto
</style>
