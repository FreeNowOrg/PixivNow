<template lang="pug">
#ranking-view
  //- Error
  section(v-if='error')
    .body-inner
      h1 排行榜加载失败
    ErrorPage(:description='error' title='出大问题')

  //- Loading
  section(v-if='rankingStore.loading')
    .body-inner
      h1 排行榜加载中……
    .loading
      Placeholder

  //- Result
  section(v-if='rankingStore.rankingData')
    .body-inner
      h1 {{ rankingStore.rankingData.date.toLocaleDateString('zh', { dateStyle: 'long' }) }}排行榜
    ArtworkLargeList(:rank-list='rankingStore.rankingData.contents')
</template>

<script lang="ts" setup>
import ArtworkLargeList from '@/components/ArtworksList/ArtworkLargeList.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Placeholder from '@/components/Placeholder.vue'

import { useRankingStore } from '@/stores/ranking'
import { effect } from 'vue'
import { setTitle } from '@/utils/setTitle'

const error = ref('')
const rankingStore = useRankingStore()
const route = useRoute()

async function init(): Promise<void> {
  const { p, mode, date } = route.query
  try {
    await rankingStore.fetchRanking({
      p: p as string | undefined,
      mode: mode as string | undefined,
      date: date as string | undefined,
    })
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
  }
}

effect(() =>
  setTitle(
    rankingStore.rankingData?.date?.toLocaleDateString('zh', {
      dateStyle: 'long',
    }),
    'Ranking'
  )
)

onMounted(() => {
  init()
})
</script>

<style scoped lang="sass">

.loading
  text-align: center
</style>
