<template lang="pug">
#search-view
  .body-inner
    SearchBox.big

  //- Error
  section(v-if='error && !searchStore.loading')
    ErrorPage(:description='error' title='出大问题')

  //- Result
  section(v-if='!error')

    //- Loading
    .loading-area(v-if='searchStore.loading && !searchStore.results.length')
      ArtworkList(:list='[]', :loading='16')

    .no-more(v-if='!searchStore.loading && !searchStore.results.length')
      NCard(style='padding: 15vh 0'): NEmpty(description='没有了，一滴都没有了……')

    NSpin.result-area(:show='searchStore.loading' v-if='searchStore.results.length')
      .pagenator
        NPagination(v-model:page='page' :item-count='searchStore.total' :page-size='searchStore.results.length')
      ArtworkLargeList(:artwork-list='searchStore.results')
      .pagenator
        NPagination(v-model:page='page' :item-count='searchStore.total' :page-size='searchStore.results.length')
</template>

<script lang="ts" setup>
definePageMeta({ name: 'search' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import SearchBox from '~/components/SearchBox.vue'
import { NButton, NSpin } from 'naive-ui'

import { useSearchStore } from '~/stores/search'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'

const error = ref('')
const searchKeyword = ref('')
const page = ref(1)
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

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
    await searchStore.search(keyword, {
      p: parseInt(p || '1'),
      mode: mode ?? 'text',
    })
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
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
  setTitle(`${route.params.keyword} (第${route.params.p}页)`, 'Search')
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
