<template lang="pug">
ul.ranking-list
  li(v-for="(item) in list")
    ranking-card(:illust="item")
</template>

<script lang="ts" setup>
import RankingCard from './RankingCard.vue'
import type { ArtworkRank } from '../../types'

const props = defineProps<{
  list: ArtworkRank[]
}>()

</script>

<style lang="sass">

.ranking-list
  display: flex
  flex-wrap: wrap
  padding-left: 0
  list-style: none
  gap: 1.5rem
  justify-content: center

  &.inline
    padding: 1rem
    flex-wrap: nowrap
    overflow-y: auto
    justify-content: left

    .ranking-card
      height: 500px
      // overflow-x: auto
</style>