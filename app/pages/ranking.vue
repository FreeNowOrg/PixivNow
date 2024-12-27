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
import type { ArtworkRank } from '~/types'

const siteCache = useSiteCacheStore()
const error = ref('')
const loading = ref(true)
const list = ref<{
  date: Date
  contents: ArtworkRank[]
} | null>(null)
const route = useRoute()

async function init(): Promise<void> {
  loading.value = true
  list.value = siteCache.get('ranking.rankingList')
  if (list.value) {
    loading.value = false
    return
  }
  try {
    const { p, mode, date } = route.query
    const params = new URLSearchParams()
    if (p && typeof p === 'string') params.append('p', p)
    if (mode && typeof mode === 'string') params.append('mode', mode)
    if (date && typeof date === 'string') params.append('date', date)
    const data = await $fetch<{
      date: string
      contents: ArtworkRank[]
    }>(`/ranking.php?${params.toString()}`)
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
    siteCache.set('ranking.rankingList', listValue)
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
  useHead({
    title: `${list.value?.date?.toLocaleDateString('zh', {
      dateStyle: 'long',
    })} | Ranking`,
  })
)

onMounted(() => {
  init()
})
</script>

<style scoped lang="sass">

.loading
  text-align: center
</style>
