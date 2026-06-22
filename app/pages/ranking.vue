<template lang="pug">
#ranking-view
  .body-inner
    h1 排行榜

  //- Error
  section(v-if='error && !rankingStore.loading')
    .body-inner
      ErrorPage(:description='error' title='出大问题')

  FnbSpin(:show='rankingStore.loading')
    .body-inner
      .ranking-filters
        .filter-row
          span.filter-label 内容
          .filter-tabs
            button.filter-tab(
              v-for='opt in contentOptions',
              :key='opt.value',
              :class='{ active: selectedContent === opt.value }',
              @click='setContentFilter(opt.value)'
            )
              | {{ opt.label }}
        .filter-row
          span.filter-label 模式
          .filter-tabs
            button.filter-tab(
              v-for='opt in activeBaseModes',
              :key='opt.value',
              :class='{ active: selectedMode === opt.value }',
              @click='setModeFilter(opt.value)'
            ) {{ opt.label }}
          FnbSelect(
            :model-value='selectedRating',
            :options='ratingOptions',
            @update:model-value='setRatingFilter'
          )

      //- Result — Artwork
      template(v-if='!isNovel && rankingStore.rankingData')
        h2.ranking-date {{ rankingStore.rankingData.date }}
        ArtworkLargeList(:rank-list='rankingStore.rankingData.contents')

      //- Result — Novel
      template(v-if='isNovel && rankingStore.novelRankingData')
        h2.ranking-date {{ rankingStore.novelRankingData.date }}
        NovelList(:list='rankingStore.novelRankingData.contents')
</template>

<script lang="ts" setup>
definePageMeta({ name: 'ranking' })
import ArtworkLargeList from '~/components/Artwork/ArtworkLargeList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import ErrorPage from '~/components/ErrorPage.vue'
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

const ratingOptions = [
  { label: '全年龄', value: 'safe' },
  { label: 'R18', value: 'r18' },
]

const artworkSafeModes = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '新人', value: 'rookie' },
  { label: '原创', value: 'original' },
  { label: 'AI', value: 'ai' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
]

const artworkR18Modes = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: 'AI', value: 'ai' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
]

const novelSafeModes = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: '月榜', value: 'monthly' },
  { label: '新人', value: 'rookie' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
]

const novelR18Modes = [
  { label: '日榜', value: 'daily' },
  { label: '周榜', value: 'weekly' },
  { label: 'AI', value: 'ai' },
  { label: '男性向', value: 'male' },
  { label: '女性向', value: 'female' },
]

const apiModeMap: Record<string, Record<string, string>> = {
  artwork: { ai: 'daily_ai' },
  'artwork-r18': {
    daily: 'daily_r18',
    weekly: 'weekly_r18',
    ai: 'daily_r18_ai',
    male: 'male_r18',
    female: 'female_r18',
  },
  novel: {},
  'novel-r18': {
    daily: 'daily_r18',
    weekly: 'weekly_r18',
    ai: 'weekly_r18_ai',
    male: 'male_r18',
    female: 'female_r18',
  },
}

function resolveApiMode(
  baseMode: string,
  rating: string,
  content: string
): string {
  const category = content === 'novel' ? 'novel' : 'artwork'
  const key = rating === 'r18' ? `${category}-r18` : category
  return apiModeMap[key]?.[baseMode] ?? baseMode
}

const error = ref('')
const rankingStore = useRankingStore()
const route = useRoute()
const router = useRouter()

const selectedContent = computed(
  () => (route.query.content as string) || 'all'
)
const selectedMode = computed(() => (route.query.mode as string) || 'daily')
const selectedRating = computed(
  () => (route.query.rating as string) || 'safe'
)
const isNovel = computed(() => selectedContent.value === 'novel')
const isR18 = computed(() => selectedRating.value === 'r18')

const activeBaseModes = computed(() => {
  if (isNovel.value) {
    return isR18.value ? novelR18Modes : novelSafeModes
  }
  return isR18.value ? artworkR18Modes : artworkSafeModes
})

function pushQuery(updates: Record<string, string>, remove?: string[]) {
  const q = { ...route.query, ...updates } as Record<string, string>
  for (const key of remove ?? []) delete q[key]
  if (q.content === 'all') delete q.content
  if (q.mode === 'daily') delete q.mode
  if (q.rating === 'safe') delete q.rating
  delete q.p
  router.push({ query: q })
}

function setContentFilter(value: string) {
  pushQuery({ content: value }, ['mode', 'rating'])
}

function setModeFilter(value: string) {
  pushQuery({ mode: value })
}

function setRatingFilter(value: string) {
  const modes = value === 'r18'
    ? (isNovel.value ? novelR18Modes : artworkR18Modes)
    : (isNovel.value ? novelSafeModes : artworkSafeModes)
  const currentModeValid = modes.some((m) => m.value === selectedMode.value)
  const updates: Record<string, string> = { rating: value }
  if (!currentModeValid) updates.mode = 'daily'
  pushQuery(updates)
}

async function init(): Promise<void> {
  const { p, date, content } = route.query
  const apiMode = resolveApiMode(
    selectedMode.value,
    selectedRating.value,
    selectedContent.value
  )
  error.value = ''
  try {
    if (content === 'novel') {
      await rankingStore.fetchNovelRanking({
        p: p as string | undefined,
        mode: apiMode,
      })
    } else {
      await rankingStore.fetchRanking({
        p: p as string | undefined,
        mode: apiMode,
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

effect(() => setTitle(rankingStore.rankingData?.date, 'Ranking'))

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
