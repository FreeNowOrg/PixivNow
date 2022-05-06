<template lang="pug">
#ranking-view
  .body-inner
    //- Error
    section(v-if='error')
      h1 排行榜加载失败
      error-page(title='出大问题', :description='error')

    //- Loading
    section(v-if='loading')
      h1 排行榜加载中……
      .loading
        placeholder

    //- Result
    section(v-if='list')
      h1 {{ list.date.toLocaleDateString('zh', { dateStyle: 'long' }) }}排行榜
      artwork-large-list(:rank-list='list.contents')
</template>

<script lang="ts" setup>
import { API_BASE } from '../config'

import ArtworkLargeList from '../components/ArtworksList/ArtworkLargeList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ArtworkRank } from '../types'
import { getCache, setCache } from './siteCache'
import { getJSON } from '../utils/fetch'

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
    const { p, mode, date } = route.params
    const searchParams = new URLSearchParams()
    if (p && typeof p === 'string') searchParams.append('p', p)
    if (mode && typeof mode === 'string')
      searchParams.append('mode', mode)
    if (date && typeof date === 'string')
      searchParams.append('date', date)
    searchParams.append('format', 'json')
    const data: {
      date: string
      contents: ArtworkRank[]
    } = await getJSON(`${API_BASE}/ranking.php?${searchParams.toString()}`)
    // Date
    const rankingDate: string = data.date
    list.value = {
      date: new Date(
        +rankingDate.substring(0, 4),
        +rankingDate.substring(4, 6) - 1,
        +rankingDate.substring(6, 8)
      ),
      contents: data.contents
    }
    setCache('ranking.rankingList', data)
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

onMounted(async () => {
  document.title = 'Ranking | PixvNow'
  await init()
})
</script>

<style scoped lang="sass">

.loading
  text-align: center
</style>
