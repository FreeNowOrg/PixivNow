<template lang="pug">
Waterfall.artwork-large-list(
  :breakpoints='{ 9999: { rowPerView: 6 }, 1600: { rowPerView: 5 }, 1200: { rowPerView: 4 }, 750: { rowPerView: 3 }, 640: { rowPerView: 2 }, 380: { rowPerView: 1 } }',
  :gutter='20',
  :has-around-gutter='false',
  :list='artworks'
  ref='waterfallRef'
)
  template(#default='{ item, index }')
    ArtworkLargeCard(:illust='item', :key='index')
</template>

<script lang="ts" setup>
import ArtworkLargeCard from './ArtworkLargeCard.vue'
import type { ArtworkInfo, RankedArtworkInfo } from '~/types'
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'

const props = defineProps<{
  rankList?: RankedArtworkInfo[]
  artworkList?: ArtworkInfo[]
}>()
const artworks = computed(() => {
  if (props.rankList) {
    return props.rankList
  } else if (props.artworkList) {
    return props.artworkList
  } else {
    return []
  }
})

const waterfallRef = ref<any>()

function resize() {
  waterfallRef.value?.renderer()
}

onMounted(async () => {
  await nextTick()
  const event = new Event('resize')
  window.dispatchEvent(event)
})
</script>

<style lang="sass">
.artwork-large-list
  align-items: center
  background: transparent !important
  overflow: visible !important
</style>
