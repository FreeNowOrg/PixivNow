<template lang="pug">
#search-view
  .body-inner
    SearchBox.big

  //- Error
  section(v-if='error && !loading')
    ErrorPage(:description='error' title='出大问题')

  //- Result
  section(v-if='!error')
    //- Loading
    .loading-area(v-if='loading && !resultList.length')
      ArtworkList(:list='[]', :loading='16')

    .no-more(v-if='!loading && !resultList.length')
      NCard(style='padding: 15vh 0'): NEmpty(description='没有了，一滴都没有了……')

    NSpin.result-area(:show='loading' v-if='resultList.length')
      .pagenator
        NPagination(
          :item-count='total',
          :page-size='resultList.length'
          v-model:page='page'
        )
      ArtworkLargeList(:artwork-list='resultList')
      .pagenator
        NPagination(
          :item-count='total',
          :page-size='resultList.length'
          v-model:page='page'
        )
</template>

<script setup lang="ts">
import { NCard, NPagination, NSpin } from 'naive-ui'

const error = ref('')
const loading = ref(true)
const searchKeyword = ref('')
const resultList = ref<ArtworkInfo[]>([])
const page = ref(1)
const total = ref(0)
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
    const data = await useAjaxResponse<{
      illustManga: { data: ArtworkInfo[]; total: number }
    }>(`/ajax/search/artworks/${encodeURIComponent(keyword)}`, {
      params: new URLSearchParams({ p: p ?? '1', mode: mode ?? 'text' }),
    })
    resultList.value = data.illustManga?.data ?? []
    total.value = data.illustManga?.total || 0
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
  makeSearch(params)
})

effect(() =>
  useHead({ title: `${route.params.keyword} (第${route.params.p}页) | Search` })
)
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
  display: flex
  justify-content: center
  margin: 1rem auto

.no-more
  text-align: center
  padding: 1rem
  opacity: 0.75

.search-box
  margin: 1rem auto
  margin-top: 2rem
  box-shadow: 0 0 8px #ddd
  border-radius: 2em
</style>
