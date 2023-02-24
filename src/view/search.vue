<template lang="pug">
mixin pagenator
  .pagenator(v-if='resultList.length >= 60')
    button.prev(disabled v-if='page === 1') 上一页
    button.prev(@click='page--' v-if='page !== 1') 上一页
    span.page {{ page }}
    button.next(@click='page++') 下一页

#search-view
  .body-inner
    search-box.big

    //- Error
    section(v-if='error && !loading')
      error-page(:description='error' title='出大问题')

    //- Result
    section(v-if='!error')
      +pagenator

      //- Loading
      .loading-area(v-if='loading')
        .align-center
          placeholder

      .result-area(v-if='!loading')
        artwork-large-list(:artwork-list='resultList')

      .no-more(v-if='!loading && resultList.length < 60') 没有了，一滴都没有了……

      +pagenator
</template>

<script lang="ts" setup>
import ArtworkLargeList from '@/components/ArtworksList/ArtworkLargeList.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Placeholder from '@/components/Placeholder.vue'
import SearchBox from '@/components/SearchBox.vue'
import type { ArtworkInfo } from '@/types'

const error = ref('')
const loading = ref(true)
const searchKeyword = ref('')
const resultList = ref<ArtworkInfo[]>([])
const page = ref(1)
const route = useRoute()
const router = useRouter()

async function makeSearch({
  keyword,
  p,
  mode,
}: {
  keyword: string
  p?: `${number}`
  mode?: string
}): Promise<void> {
  searchKeyword.value = keyword
  page.value = parseInt(p || '1')
  error.value = ''
  if (!searchKeyword.value) return
  try {
    loading.value = true
    document.title = `${keyword} (第${p}页) | Search | PixivNow`
    const { data } = await axios.get<{ illustManga: { data: ArtworkInfo[] } }>(
      `/ajax/search/artworks/${encodeURIComponent(keyword)}`,
      { params: new URLSearchParams({ p: p ?? '1', mode: mode ?? 'text' }) }
    )
    resultList.value = data.illustManga?.data ?? []
    console.info(data.illustManga?.data)
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

watch(page, (value) => {
  page.value = value < 1 ? 1 : value
  router.push(
    `/search/${searchKeyword.value}/${page.value}${
      route.query.mode ? `?mode=${route.query.mode}` : ''
    }`
  )
})

onBeforeRouteUpdate(async (to) => {
  const params = to.params as {
    keyword: string
    p?: `${number}`
    mode?: string
  }
  await makeSearch(params)
})

onMounted(async () => {
  const params = route.params as {
    keyword: string
    p?: `${number}`
    mode?: string
  }
  await makeSearch(params)
})
</script>

<style lang="sass" scoped>

.pagenator
  text-align: center

  .page
    display: inline-block
    text-align: center
    width: 3rem

.no-more
  text-align: center
  padding: 1rem
  border-radius: 4px
  box-shadow: 0 0 4px #aaaaaa

.search-box
  margin: 2rem auto
  box-shadow: 0 0 8px #ddd
  border-radius: 2em
</style>
