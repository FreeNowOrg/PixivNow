<template lang="pug">
Waterfall.artwork-large-list(
  ref='waterfallRef',
  :list='artworks',
  :breakpoints='{ 9999: { rowPerView: 6 }, 1600: { rowPerView: 5 }, 1200: { rowPerView: 4 }, 750: { rowPerView: 3 }, 640: { rowPerView: 2 }, 380: { rowPerView: 1 } }'
)
  template(#item='{ item, index }')
    ArtworkLargeCard(:illust='item[0]', :rank='item[1]' :key='index')
</template>

<script lang="ts" setup>
import ArtworkLargeCard from './ArtworkLargeCard.vue'
import type { ArtworkInfo, ArtworkRank } from '@/types'
import { Waterfall } from 'vue-waterfall-plugin-next'
import 'vue-waterfall-plugin-next/dist/style.css'

const props = defineProps<{
  rankList?: ArtworkRank[]
  artworkList?: ArtworkInfo[]
}>()
const artworks = computed(() => {
  if (props.rankList) {
    return convertRankToInfo(props.rankList)
  } else if (props.artworkList) {
    return props.artworkList.map((item): [ArtworkInfo, number] => {
      return [item, 0]
    })
  } else {
    return []
  }
})

function convertRankToInfo(rankInfo: ArtworkRank[]): [ArtworkInfo, number][] {
  return rankInfo.map((item): [ArtworkInfo, number] => {
    return [
      // @ts-ignore
      {
        id: `${item.illust_id}`,
        title: item.title,
        description: '',
        createDate: item.date,
        updateDate: item.date,
        illustType: 0,
        restrict: 0,
        xRestrict: item.illust_content_type.sexual,
        sl: 2,
        userId: `${item.user_id}`,
        userName: item.user_name,
        alt: item.title,
        width: item.width,
        height: item.height,
        pageCount: +item.illust_page_count,
        isBookmarkable: true,
        bookmarkData: null,
        titleCaptionTranslation: {
          workTitle: null,
          workCaption: null,
        },
        isUnlisted: false,
        url: item.url,
        tags: item.tags,
        profileImageUrl: item.profile_img,
        type: 'illust',
      },
      item.rank,
    ]
  })
}

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
</style>
