<template lang="pug">
ul.artworksList
  li(v-for="item in list")
    artwork-card(v-if="item" :illust="item")
  li 
    slot/
</template>

<script lang="ts" setup>
import ArtworkCard from './ArtworkCard.vue'

const props = defineProps<{
  list: {
    id: `${number}`
    illustId: `${number}`
    title: string
    userName: string
    userId: string
    profileImageUrl: string
    profileImg: string
    tags: string[]
    xRestrict: 0 | 1 | 2
    pageCount: number
    rank: number
    isAdContainer: boolean
    url: string
  }[]
}>()
</script>

<style lang="sass">
.artworksList
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

    .illustCard
      height: 500px
      // overflow-x: auto
</style>
