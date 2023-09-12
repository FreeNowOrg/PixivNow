<template lang="pug">
Component.artworks-list(
  :class='{ inline }',
  :is='inline ? NScrollbar : "ul"'
  trigger='none'
  x-scrollable
)
  li(v-for='_ in skeletonNumber' v-if='loading')
    ArtworkCard(loading)
  li(:key='item.id' v-else v-for='item in artworks')
    ArtworkCard(:item='item')
</template>

<script lang="ts" setup>
import ArtworkCard from './ArtworkCard.vue'
import { isArtwork } from '@/utils'
import type { ArtworkInfo, ArtworkInfoOrAd } from '@/types'
import { NScrollbar } from 'naive-ui'

const props = defineProps<{
  list: ArtworkInfoOrAd[]
  loading?: boolean | number
  inline?: boolean
}>()

const skeletonNumber = computed(() =>
  typeof props.loading === 'number' ? props.loading : 8
)

const artworks = computed(() => {
  return props.list.filter((item): item is ArtworkInfo => isArtwork(item))
})
</script>

<style lang="sass">
.artworks-list
  margin-top: 1rem
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
    max-width: calc(45vw - 1.5rem)
    display: inline-block

.tiny
  gap: 0.75rem

  li
    width: 100px

  .info
    display: none
</style>
