<template lang="pug">
#ranking-view
  //- Error
  section(v-if='error')
    .body-inner
      h1 排行榜加载失败
    ErrorPage(:description='error' title='出大问题')

  //- Loading
  section(v-if='loading')
    .body-inner
      h1 排行榜加载中……
    .loading
      Placeholder

  //- Result
  section(v-if='list')
    .body-inner
      h1 {{ list.date.toLocaleDateString('zh', { dateStyle: 'long' }) }}排行榜
    ArtworkLargeList(:rank-list='list.contents')
</template>

<script lang="ts" setup>
import ArtworkLargeList from '@/components/ArtworksList/ArtworkLargeList.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Placeholder from '@/components/Placeholder.vue'

import type { ArtworkRank } from '@/types'
import { getCache, setCache } from './siteCache'
import { ajax } from '@/utils/ajax'
import { effect } from 'vue'
import { setTitle } from '@/utils/setTitle'

const error = ref('')
const loading = ref(true)
const list = ref<{
  date: Date
  contents: ArtworkRank[]
} | null>(null)
const route = useRoute()

async function init(): Promise<void> {
  loading.value = true
  list.value = getCache('ranking.rankingList')
  if (list.value) {
    loading.value = false
    return
  }
  try {
    const { p, mode, date } = route.query
    const searchParams = new URLSearchParams()
    if (p && typeof p === 'string') searchParams.append('p', p)
    if (mode && typeof mode === 'string') searchParams.append('mode', mode)
    if (date && typeof date === 'string') searchParams.append('date', date)
    searchParams.append('format', 'json')
    const { data } = await ajax.get<{
      date: string
      contents: ArtworkRank[]
    }>('/ranking.php', { params: searchParams })
    // Date
    const rankingDate = data.date
    const listValue = {
      date: new Date(
        +rankingDate.substring(0, 4),
        +rankingDate.substring(4, 6) - 1,
        +rankingDate.substring(6, 8)
      ),
      contents: data.contents,
    }
    list.value = listValue
    setCache('ranking.rankingList', listValue)
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
  } finally {
    loading.value = false
  }
}

effect(() =>
  setTitle(
    list.value?.date?.toLocaleDateString('zh', { dateStyle: 'long' }),
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
