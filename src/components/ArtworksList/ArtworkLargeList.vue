<template lang="pug">
//- ul.artwork-large-list
//-   li(v-for='item in artworks')
VueFlexWaterfall.artwork-large-list(
  :break-at='{ 1200: 4, 900: 3, 600: 2, 300: 1 }'
  align-content='center'
  col='5'
  col-spacing='16'
)
  ArtworkLargeCard(:illust='item[0]', :rank='item[1]' v-for='item in artworks')
</template>

<script lang="ts" setup>
import ArtworkLargeCard from './ArtworkLargeCard.vue'
import { VueFlexWaterfall } from 'vue-flex-waterfall'
import type { ArtworkInfo, ArtworkRank } from '@/types'

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
</script>

<style lang="sass"></style>
