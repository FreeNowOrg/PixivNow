<template lang="pug">
#ranking-view
  //- 已登录
  .isLoggedIn.body-inner
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
      artworks-list(:list='list.contents')
</template>

<script lang="ts" setup>
import axios from 'axios'
import { userData } from '../components/userData'
import { API_BASE } from '../config'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const error = ref('')
const loading = ref(true)
const list = ref<{
  date: Date
  contents: {
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
} | null>(null)
const route = useRoute()

function init(): void {
  const { p, mode, date } = route.params
  axios
    .get(`${API_BASE}/api/ranking`, {
      params: {
        p,
        mode,
        date,
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
      }
    )
    .finally(() => loading.value = false)
}

onMounted(() => {
  if (!userData.value) {
    console.log('或许需要绑定令牌？')
  }
  document.title = 'Ranking | PixvNow'
  init()
})
</script>

<style scoped lang="sass">
.loading
  text-align: center
</style>
