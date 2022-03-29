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
import axios from 'axios'
import { API_BASE } from '../config'

import ArtworkLargeList from '../components/ArtworksList/ArtworkLargeList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ArtworkRank } from '../types'
import { getCache, setCache } from './siteCache'

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
    const { data } = await axios.get(`${API_BASE}/ranking.php`, {
      params: {
        p,
        mode,
        date,
        format: 'json',
      },
    })
    // Date
    const temp: string = data.date
    data.date = new Date(
      +temp.substring(0, 4),
      +temp.substring(4, 6) - 1,
      +temp.substring(6, 8)
    )
    list.value = data
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
