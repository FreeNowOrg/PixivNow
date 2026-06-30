<template lang="pug">
#search-view
  .body-inner
    SearchBox.big
    .search-filters
      .content-tabs
        button.content-tab(
          v-for='opt in contentOptions',
          :key='opt.value',
          :class='{ active: selectedType === opt.value }',
          @click='setQuery({ type: opt.value })'
        ) {{ opt.label }}
      .refine-bar
        .refine-field
          span.refine-label 匹配
          FnbSelect(
            :model-value='selectedSMode',
            :options='activeSModeOptions',
            @update:model-value='v => setQuery({ s_mode: v })'
          )
        .refine-field
          span.refine-label 排序
          FnbSelect(
            :model-value='selectedOrder',
            :options='orderOptions',
            @update:model-value='v => setQuery({ order: v })'
          )
        .refine-field
          span.refine-label 分级
          FnbSelect(
            :model-value='selectedMode',
            :options='modeOptions',
            @update:model-value='v => setQuery({ mode: v })'
          )
        .refine-field
          span.refine-label AI
          FnbSelect(
            :model-value='selectedAiType',
            :options='aiTypeOptions',
            @update:model-value='v => setQuery({ ai_type: v })'
          )
        .refine-field(v-if='isNovel')
          span.refine-label 语言
          FnbSelect(
            :model-value='selectedLang',
            :options='langOptions',
            @update:model-value='v => setQuery({ lang: v })'
          )

  //- Error
  section(v-if='error && !searchStore.loading')
    ErrorPage(:description='error' title='出大问题')

  //- Landing: no keyword yet
  section.search-landing(v-else-if='!hasQuery')
    .body-inner
      .fnb-empty(style='padding: 12vh 0; text-align: center') 输入关键词开始搜索

  //- Result (has keyword)
  section(v-else)

    //- Loading skeleton
    .loading-area(v-if='searchStore.loading && !currentResults.length')
      ArtworkList(v-if='!isNovel', :list='[]', :loading='16')
      .body-inner(v-else)
        NovelList(:list='[]', :loading='12')

    //- Empty
    .no-more(v-if='!searchStore.loading && !currentResults.length')
      FnbCard(style='padding: 15vh 0; text-align: center')
        .fnb-empty 没有了，一滴都没有了……

    //- Results
    FnbSpin.result-area(:show='searchStore.loading', v-if='currentResults.length')
      .body-inner
        .pagenator
          FnbPagination(
            :page='page',
            :item-count='currentTotal',
            :page-size='currentResults.length',
            @update:page='goPage'
          )
        ArtworkLargeList(v-if='!isNovel', :artwork-list='searchStore.artworkResults')
        NovelList(v-else, :list='searchStore.novelResults')
        .pagenator
          FnbPagination(
            :page='page',
            :item-count='currentTotal',
            :page-size='currentResults.length',
            @update:page='goPage'
          )
</template>

<script lang="ts" setup>
definePageMeta({ name: 'search' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import SearchBox from '~/components/SearchBox.vue'
import { useSearchStore, type SearchContentType } from '~/stores/search'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'
import { contentOptions } from '~/utils/searchOptions'

// ── Filter options ──

const artworkSModeOptions = [
  { label: '标签（部分一致）', value: 's_tag' },
  { label: '标签（完全一致）', value: 's_tag_full' },
  { label: '标题、说明文字', value: 's_tc' },
  { label: '标签、标题、说明', value: 's_tag_tc' },
]

const novelSModeOptions = [
  { label: '标签、标题、说明', value: 's_tag' },
  { label: '标签（部分一致）', value: 's_tag_only' },
  { label: '标签（完全一致）', value: 's_tag_full' },
  { label: '正文', value: 's_tc' },
]

const orderOptions = [
  { label: '新到旧', value: 'date_d' },
  { label: '旧到新', value: 'date' },
]

const modeOptions = [
  { label: '混池', value: 'all' },
  { label: '全年龄', value: 'safe' },
  { label: 'R18', value: 'r18' },
]

const aiTypeOptions = [
  { label: '含AI作品', value: '' },
  { label: '隐藏AI作品', value: '1' },
]

const langOptions = [
  { label: '全部语言', value: '' },
  { label: '中文', value: 'zh-cn' },
  { label: '日本語', value: 'ja' },
  { label: 'English', value: 'en' },
  { label: '한국어', value: 'ko' },
]

// ── State ──

const error = ref('')
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

const keyword = computed(() => (route.query.q as string) || '')
const hasQuery = computed(() => !!keyword.value)
const page = computed(() => {
  const p = parseInt((route.query.p as string) || '1')
  return p > 0 ? p : 1
})

const selectedType = computed(() => (route.query.type as string) || 'artworks')
const selectedSMode = computed(() => (route.query.s_mode as string) || 's_tag')
const selectedOrder = computed(() => (route.query.order as string) || 'date_d')
const selectedMode = computed(() => (route.query.mode as string) || 'all')
const selectedAiType = computed(() => (route.query.ai_type as string) || '')
const selectedLang = computed(() => (route.query.lang as string) || '')

const isNovel = computed(() => selectedType.value === 'novels')

const activeSModeOptions = computed(() =>
  isNovel.value ? novelSModeOptions : artworkSModeOptions
)

const currentResults = computed(() =>
  isNovel.value ? searchStore.novelResults : searchStore.artworkResults
)

const currentTotal = computed(() =>
  isNovel.value ? searchStore.novelTotal : searchStore.artworkTotal
)

// ── Query helpers ──

const defaults: Record<string, string> = {
  type: 'artworks',
  s_mode: 's_tag',
  order: 'date_d',
  mode: 'all',
  ai_type: '',
  lang: '',
}

function setQuery(updates: Record<string, string>) {
  const q = { ...route.query } as Record<string, string>
  const isTypeSwitch = 'type' in updates

  for (const [key, value] of Object.entries(updates)) {
    if (value === defaults[key] || value === '') {
      delete q[key]
    } else {
      q[key] = value
    }
  }

  if (isTypeSwitch) {
    delete q.s_mode
    delete q.lang
  }

  delete q.p
  router.push({ query: q })
}

function goPage(value: number) {
  const target = value < 1 ? 1 : value
  const q = { ...route.query } as Record<string, string>
  if (target === 1) delete q.p
  else q.p = String(target)
  router.push({ query: q })
}

// ── Search execution ──

async function makeSearch(): Promise<void> {
  error.value = ''
  if (!keyword.value) return

  try {
    if (isNovel.value) {
      await searchStore.searchNovels(keyword.value, {
        p: page.value,
        s_mode: selectedSMode.value,
        order: selectedOrder.value,
        mode: selectedMode.value,
        ai_type: selectedAiType.value || undefined,
        work_lang: selectedLang.value || undefined,
      })
    } else {
      await searchStore.searchArtworks(
        keyword.value,
        selectedType.value as SearchContentType,
        {
          p: page.value,
          s_mode: selectedSMode.value,
          order: selectedOrder.value,
          mode: selectedMode.value,
          ai_type: selectedAiType.value || undefined,
        }
      )
    }
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了！'
    }
  }
}

// ── Watchers ──

watch(() => route.query, makeSearch, { deep: true })

effect(() =>
  keyword.value
    ? setTitle(`${keyword.value} (第${page.value}页)`, 'Search')
    : setTitle('搜索')
)

onMounted(() => makeSearch())
</script>

<style lang="scss" scoped>
.search-filters {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1rem;
}

// ── Primary axis: content type ──
.content-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.content-tab {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.4rem 0.95rem;
  font-family: var(--fnb-font-display);
  font-size: 0.9rem;
  font-weight: 800;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  transition: all 150ms;

  &.active {
    background: var(--fnb-brand);
    color: var(--fnb-on-brand);
    box-shadow: none;
    transform: translate(2px, 2px);
  }

  &:hover:not(.active) {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
  }
}

// ── Secondary axis: refinement ──
.refine-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 1.15rem;
}

.refine-field {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.refine-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--fnb-text-muted);
  white-space: nowrap;
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
  box-shadow: 0 0 8px var(--fnb-divider);
}

.fnb-empty {
  color: var(--fnb-text-muted);
  padding: 1rem;
}
</style>
