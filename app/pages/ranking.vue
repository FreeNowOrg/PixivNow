<template lang="pug">
#ranking-view
  .body-inner
    h1 排行榜
    .ranking-filters
      .filter-row
        span.filter-label 内容
        .filter-tabs
          button.filter-tab(
            v-for='opt in contentOptions',
            :key='opt.value',
            :class='{ active: selectedContent === opt.value }',
            @click='setFilter("content", opt.value)'
          )
            | {{ opt.label }}
      .filter-row
        span.filter-label 模式
        .filter-tabs
          button.filter-tab(
            v-for='opt in activeModeOptions',
            :key='opt.value',
            :class='{ active: selectedMode === opt.value }',
            @click='setFilter("mode", opt.value)'
          ) {{ opt.label }}

  //- Error
  section(v-if='error')
    .body-inner
      ErrorPage(:description='error' title='出大问题')

  //- Loading
  section(v-if='rankingStore.loading')
    .body-inner
      .loading
        Placeholder

  //- Result — Artwork
  section(v-if='!isNovel && rankingStore.rankingData')
    .body-inner
      h2.ranking-date {{ rankingStore.rankingData.date.toLocaleDateString('zh', { dateStyle: 'long' }) }}
      ArtworkLargeList(:rank-list='rankingStore.rankingData.contents')

  //- Result — Novel
  section(v-if='isNovel && rankingStore.novelRankingData')
    .body-inner
      h2.ranking-date {{ rankingStore.novelRankingData.date }}
      NovelList(:list='rankingStore.novelRankingData.contents')
</template>

<script lang="ts" setup>
definePageMeta({ name: 'ranking' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import Placeholder from '~/components/Placeholder.vue'
import { useRankingStore } from '~/stores/ranking'
import { effect } from 'vue'
import { setTitle } from '~/utils/setTitle'

const contentOptions = [
  { label: '综合', value: 'all' },
  { label: '插画', value: 'illust' },
  { label: '动图', value: 'ugoira' },
  { label: '漫画', value: 'manga' },
  { label: '小说', value: 'novel' },
]

const artworkModeOptions = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '新人', value: 'rookie' },
  { label: '原创', value: 'original' },
  { label: 'AI', value: 'daily_ai' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
  { label: 'R18 日榜', value: 'daily_r18' },
  { label: 'R18 周榜', value: 'weekly_r18' },
  { label: 'R18 AI', value: 'daily_r18_ai' },
  { label: 'R18 男性向', value: 'male_r18' },
  { label: 'R18 女性向', value: 'female_r18' },
]

const novelModeOptions = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '新人', value: 'rookie' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
  { label: 'R18 日榜', value: 'daily_r18' },
  { label: 'R18 周榜', value: 'weekly_r18' },
  { label: 'R18 AI', value: 'weekly_r18_ai' },
  { label: 'R18 男性向', value: 'male_r18' },
  { label: 'R18 女性向', value: 'female_r18' },
]

const error = ref('')
const rankingStore = useRankingStore()
const route = useRoute()
const router = useRouter()

const selectedContent = computed(() => (route.query.content as string) || 'all')
const selectedMode = computed(() => (route.query.mode as string) || 'daily')
const isNovel = computed(() => selectedContent.value === 'novel')

const activeModeOptions = computed(() =>
  isNovel.value ? novelModeOptions : artworkModeOptions
)

function setFilter(key: string, value: string) {
  const query = { ...route.query, [key]: value }
  if (key === 'content' && value === 'all') delete query.content
  if (key === 'mode' && value === 'daily') delete query.mode
  if (key === 'content') delete query.mode
  delete query.p
  router.push({ query })
}

async function init(): Promise<void> {
  const { p, mode, date, content } = route.query
  error.value = ''
  try {
    if (content === 'novel') {
      await rankingStore.fetchNovelRanking({
        p: p as string | undefined,
        mode: (mode as string) || 'daily',
      })
    } else {
      await rankingStore.fetchRanking({
        p: p as string | undefined,
        mode: (mode as string) || 'daily',
        date: date as string | undefined,
        content: (content as string) || 'all',
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

effect(() =>
  setTitle(
    rankingStore.rankingData?.date?.toLocaleDateString('zh', {
      dateStyle: 'long',
    }),
    'Ranking'
  )
)

watch(() => route.query, () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
.ranking-filters {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-label {
  font-family: var(--fnb-font-display);
  font-weight: 900;
  font-size: 0.85rem;
  flex-shrink: 0;
  width: 2.5em;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
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

.ranking-date {
  margin-top: 0;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
}
</style>
