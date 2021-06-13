<template lang="pug">
ul.artworksList
  li(v-for="item in list")
    artwork-card(v-if="item" :illust="item")
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

  &.inline
    flex-wrap: nowrap
    overflow-y: auto

    .illustCard
      height: 500px
      // overflow-x: auto
</style>
