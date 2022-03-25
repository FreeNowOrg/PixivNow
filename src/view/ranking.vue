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
      ranking-list(:list='list.contents')
</template>

<script lang="ts" setup>
import axios from 'axios'
import { API_BASE } from '../config'

import RankingList from '../components/RankingList/RankingList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ArtworkRank } from '../types'

const error = ref('')
const loading = ref(true)
const list = ref<{
  date: Date
  contents: ArtworkRank[]
} | null>(null)
const route = useRoute()

function init(): void {
  const { p, mode, date } = route.params
  axios
    .get(`${API_BASE}/ranking.php`, {
      params: {
        p,
        mode,
        date,
        format: 'json',
      },
    })
    .then(({ data }) => {
      // Date
      const date: string = data.date
      data.date = new Date(
        +date.substring(0, 4),
        +date.substring(4, 6) - 1,
        +date.substring(6, 8)
      )
      list.value = data
      console.log(data.contents)
    })
    .catch((err) => {
      error.value =
        err?.response?.data?.error || err.message || '出现未知问题'
    })
    .finally(() => loading.value = false)
}

onMounted(() => {
  document.title = 'Ranking | PixvNow'
  init()
})
</script>

<style scoped lang="sass">

.loading
  text-align: center
</style>
