<template lang="pug">
mixin pagenator
  .pagenator(v-if='resultList.length >= 60')
    NButton.prev(
      :disabled='prevDisabled'
      @click='page--'
      circle
      secondary
      type='primary'
    ): IFaSolidAngleLeft
    span.page {{ page }}
    NButton.next(@click='page++' circle secondary type='primary'): IFaSolidAngleRight

#search-view
  .body-inner
    SearchBox.big

    //- Error
    section(v-if='error && !loading')
      ErrorPage(:description='error' title='出大问题')

    //- Result
    section(v-if='!error')
      +pagenator

      //- Loading
      .loading-area(v-if='loading && !resultList.length')
        ArtworkList(:list='[]', :loading='16')

      NSpin.result-area(:show='loading' v-if='resultList.length')
        ArtworkLargeList(:artwork-list='resultList')

      .no-more(v-if='noMoreArtworks') 没有了，一滴都没有了……

      +pagenator
</template>

<script setup lang="ts">
import { NButton, NSpin } from 'naive-ui'
import IFaSolidAngleLeft from '~icons/fa-solid/angle-left'
import IFaSolidAngleRight from '~icons/fa-solid/angle-right'

import type { ArtworkInfo } from '~/types'

const error = ref('')
const loading = ref(true)
const searchKeyword = ref('')
const resultList = ref<ArtworkInfo[]>([])
const page = ref(1)
const route = useRoute()
const router = useRouter()
const prevDisabled = computed(() => page.value <= 1)
const noMoreArtworks = computed(
  () => !loading.value && resultList.value.length < 60
)

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
    const data = await $fetch<{ illustManga: { data: ArtworkInfo[] } }>(
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

<style lang="sass">
.pagenator
  text-align: center
  margin: 1rem auto

  .page
    display: inline-block
    text-align: center
    width: 3rem

.no-more
  text-align: center
  padding: 1rem
  opacity: 0.75

.search-box
  margin: 2rem auto
  box-shadow: 0 0 8px #ddd
  border-radius: 2em
</style>
