<template lang="pug">
#search-view
  .body-inner
    SearchBox.big
    .search-type-tabs
      button.search-type-tab(
        :class='{ active: searchType !== "novel" }',
        @click='switchType("artworks")'
      ) 插画·漫画
      button.search-type-tab(
        :class='{ active: searchType === "novel" }',
        @click='switchType("novel")'
      ) 小说

  //- Error
  section(v-if='error && !searchStore.loading')
    ErrorPage(:description='error' title='出大问题')

  //- Result
  section(v-if='!error')

    //- Loading
    .loading-area(v-if='searchStore.loading && !currentResults.length')
      ArtworkList(v-if='searchType !== "novel"', :list='[]', :loading='16')
      .body-inner(v-else)
        NovelList(:list='[]', :loading='12')

    .no-more(v-if='!searchStore.loading && !currentResults.length')
      FnbCard(style='padding: 15vh 0; text-align: center')
        .fnb-empty 没有了，一滴都没有了……

    FnbSpin.result-area(:show='searchStore.loading' v-if='currentResults.length')
      .body-inner
        .pagenator
          FnbPagination(
            :page='page'
            :item-count='currentTotal'
            :page-size='currentResults.length'
            @update:page='page = $event'
          )
        ArtworkLargeList(v-if='searchType !== "novel"', :artwork-list='searchStore.results')
        NovelList(v-else, :list='searchStore.novelResults')
        .pagenator
          FnbPagination(
            :page='page'
            :item-count='currentTotal'
            :page-size='currentResults.length'
            @update:page='page = $event'
          )
</template>

<script lang="ts" setup>
definePageMeta({ name: 'search' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import SearchBox from '~/components/SearchBox.vue'
import { useSearchStore } from '~/stores/search'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'

const error = ref('')
const searchKeyword = ref('')
const page = ref(1)
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

const searchType = computed(() => (route.query.type as string) || 'artworks')

const currentResults = computed(() =>
  searchType.value === 'novel' ? searchStore.novelResults : searchStore.results
)

const currentTotal = computed(() =>
  searchType.value === 'novel' ? searchStore.novelTotal : searchStore.total
)

function switchType(type: string) {
  const query = { ...route.query, type }
  if (type === 'artworks') delete query.type
  router.push({ query })
}

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
    if (searchType.value === 'novel') {
      await searchStore.searchNovels(keyword, {
        p: parseInt(p || '1'),
      })
    } else {
      await searchStore.search(keyword, {
        p: parseInt(p || '1'),
        mode: mode ?? 'text',
      })
    }
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
  const query = route.query.type ? `?type=${route.query.type}` : ''
  router.push(`/search/${searchKeyword.value}/${page.value}${query}`)
})

watch(() => route.query.type, () => {
  makeSearch(route.params as { keyword: string; p?: `${number}` })
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

<style lang="scss" scoped>
.search-type-tabs {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.search-type-tab {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.3rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  transition: all 150ms;

  &.active {
    background: var(--fnb-brand);
    color: #fff;
    box-shadow: none;
    transform: translate(3px, 3px);
  }

  &:hover:not(.active) {
    background: var(--fnb-highlight);
  }
}

.pagenator {
  display: flex;
  justify-content: center;
  margin: 1rem auto;
}

.no-more {
  text-align: center;
  padding: 1rem;
  opacity: 0.75;
}

.search-box {
  margin: 1rem auto;
  margin-top: 2rem;
  box-shadow: 0 0 8px #ddd;
}

.fnb-empty {
  color: var(--fnb-text-muted);
  padding: 1rem;
}
</style>
