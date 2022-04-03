<template lang="pug">
ul.artworks-list
  li(v-for="(item) in artworks"
    :key="item.id"
  )
    artwork-card(:item="item")
</template>

<script lang="ts" setup>
import ArtworkCard from './ArtworkCard.vue'

import type { ArtworkInfo, ArtworkInfoOrAd } from '../../types'
import { computed } from 'vue'

const props = defineProps<{
  list: ArtworkInfoOrAd[]
}>()

const artworks = computed(() => {
  return props.list.filter((item) =>
    Object.keys(item).includes('id')
  ) as ArtworkInfo[]
})
</script>

<style lang="sass">

.artworks-list
  list-style: none
  padding-left: 0
  display: flex
  flex-wrap: wrap
  gap: 1.5rem
  justify-content: center

  &.inline
    overflow-y: auto
    white-space: nowrap
    display: block

    li:not(:first-of-type)
      margin-left: 0.75rem

  li
    width: 180px
    max-width: calc(50vw - 2rem)
    display: inline-block

.tiny
  gap: 0.75rem

  li
    width: 100px

  .info
    display: none
</style>
