<template lang="pug">
mixin pagenator()
  .pagenator(v-if="resultList.length >= 60")
    button.prev(v-if="p === 1" disabled) 上一页
    button.prev(v-if="p !== 1" @click="p--") 上一页
    span.page {{ p }}
    button.next(@click="p++") 下一页


#search-view
  .body-inner
    search-box.big

    //- Error
    section(v-if="error && !loading")
      error-page(title="出大问题", :description="error")

    //- Result
    section(v-if="!error")
      +pagenator()

      //- Loading
      .loadingArea(v-if="loading")
        div(style="text-align: center")
          placeholder

      .resultArea(v-if="!loading")
        artworks-list(:list="resultList")

      .noMore(v-if="!loading && resultList.length < 60") 没有了，一滴都没有了……

      +pagenator()
</template>

<script lang="ts" setup>
import axios from 'axios'
import { API_BASE } from '../config'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'
import SearchBox from '../components/SearchBox.vue'
import { onMounted, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

const error = ref('')
const loading = ref(true)
const keyword = ref('')
const resultList = ref([])
const p = ref(1)
const route = useRoute()
const router = useRouter()

function makeSearch(params: {
  keyword: string
  p?: `${number}`
  mode?: string
}): void {
  loading.value = true
  keyword.value = params.keyword
  p.value = parseInt(params.p || '1')
  if (!keyword.value) return

  document.title = `${params.keyword} (第${params.p}页) | Search | PixivNow`

  axios
    .get(`${API_BASE}/api/search/${encodeURIComponent(params.keyword)}`, {
      params: {
        p: params.p,
        mode: params.mode || 'all'
      }
    })
    .then(
      ({data}) => {
        resultList.value = data?.illustManga?.data || []
        console.info(data?.illustManga?.data)
      }
    )
    .catch(
      (err) => {
        error.value = err?.response?.data?.message || err.message || 'HTTP 请求超时'
      }
    )
    .finally(() => loading.value = false)
}

watch(p, (value) => {
  p.value = value < 1 ? 1 : value
  router.push(
    `/search/${keyword.value}/${p.value}${
    route.query.mode ? '?mode=' + route.query.mode : ''
    }`
  )
})

onBeforeRouteUpdate((to, from) => {
  const params = to.params as {
    keyword: string
    p?: `${number}`
    mode?: string
  }
  if (params.keyword !== from.params.keyword) {
    makeSearch(params)
  }
})

onMounted(() => {
  const params = route.params as {
    keyword: string
    p?: `${number}`
    mode?: string
  }
  makeSearch(params)
})
</script>

<style lang="sass" scoped>
.pagenator
  text-align: center

  .page
    display: inline-block
    text-align: center
    width: 3rem

.noMore
  text-align: center
  padding: 1rem
  border-radius: 4px
  box-shadow: 0 0 4px #aaaaaa

.searchBox
  margin: 2rem auto
  box-shadow: 0 0 8px #ddd
  border-radius: 2em
</style>
