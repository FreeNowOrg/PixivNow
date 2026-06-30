<template lang="pug">
#novel-series-view
  //- Loading
  section.placeholder(v-if='loading')
    .body-inner
      .series-hero
        FnbSkeleton(block height='320px' width='220px')
        .summary
          h1: FnbSkeleton(height='2rem' width='18rem')
          FnbSkeleton(:repeat='5' text)

  //- Done
  section.series-container(v-else-if='!error && series')
    .body-inner
      .series-hero
        .cover(v-if='coverUrl')
          img(:alt='series.title' :src='coverUrl')
        .summary
          h1(:class='{ danger: series.xRestrict }') {{ series.title }}
          .meta
            span(v-if='series.xRestrict') R-18
            span(v-if='series.isConcluded') 已完结
            span(v-else) 连载中
            span {{ series.publishedContentCount }} 篇
            span(v-if='series.publishedTotalCharacterCount') {{ series.publishedTotalCharacterCount }} 字
            span(v-if='series.publishedReadingTime') {{ Math.ceil(series.publishedReadingTime / 60) }} 分钟
          p.description.pre(v-if='captionText') {{ captionText }}
          .tags
            ArtTag(
              :key='tag',
              :tag='tag',
              :search-query='{ type: "novels", s_mode: "s_tag_only" }',
              v-for='tag in series.tags'
            )
          .actions
            FnbButton(
              :href='series.extraData?.meta?.canonical || `https://www.pixiv.net/novel/series/${series.id}`'
              rel='noopener noreferrer'
              size='sm'
              tag='a'
              target='_blank'
            )
              | 前往 Pixiv 查看
              template(#icon)
                IFasArrowRight

    .body-inner.content-grid
      main
        Card(title='目录')
          .fnb-empty(v-if='!seriesNovels.length && !contentTitles.length') 这个系列还没有可显示的章节
          NovelList(:list='seriesNovels' v-else-if='seriesNovels.length')
          ul.title-list(v-else)
            li(:class='{ unavailable: !item.available }' :key='item.id' v-for='item in contentTitles')
              RouterLink(:to='`/novels/${item.id}`' v-if='item.available') {{ item.title }}
              span(v-else) {{ item.title }}
      aside.side-area
        Card(title='作者')
          RouterLink.author(:to='`/users/${series.userId}`')
            img(:src='series.profileImageUrl' v-if='series.profileImageUrl')
            span {{ series.userName }}
        Card(title='快速入口')
          .quick-links
            RouterLink.plain(:to='`/novels/${series.firstNovelId}`' v-if='series.firstNovelId')
              FnbButton(size='sm') 第一篇
            RouterLink.plain(:to='`/novels/${series.latestNovelId}`' v-if='series.latestNovelId')
              FnbButton(size='sm') 最新篇

  //- Error
  section.error(v-if='error')
    ErrorPage(:description='error' title='出大问题')
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'novel-series',
  alias: ['/novels/series/:id'],
})
import ArtTag from '~/components/ArtTag.vue'
import Card from '~/components/Card.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import IFasArrowRight from '~icons/fa-solid/arrow-right'
import { effect } from 'vue'
import { useNovelStore } from '~/stores/novel'
import type { NovelContentTitle, NovelInfo, NovelSeries } from '~/types'
import { stripHtmlText } from '~/utils/novel-content'
import { setTitle } from '~/utils/setTitle'

const route = useRoute()
const novelStore = useNovelStore()
const loading = ref(true)
const error = ref('')
const series = ref<NovelSeries>()
const seriesNovels = ref<NovelInfo[]>([])
const contentTitles = ref<NovelContentTitle[]>([])

const coverUrl = computed(() =>
  series.value?.cover?.urls.original ||
  series.value?.cover?.urls['1200x1200'] ||
  series.value?.cover?.urls['480mw'] ||
  series.value?.firstEpisode?.url ||
  ''
)
const captionText = computed(() =>
  series.value?.caption ? stripHtmlText(series.value.caption).trim() : ''
)

async function init(id: string): Promise<void> {
  loading.value = true
  error.value = ''
  series.value = undefined
  seriesNovels.value = []
  contentTitles.value = []

  try {
    const [seriesData, novels, titles] = await Promise.all([
      novelStore.fetchNovelSeries(id),
      novelStore.fetchNovelSeriesContent(id).catch(() => []),
      novelStore.fetchNovelSeriesContentTitles(id).catch(() => []),
    ])
    series.value = seriesData
    seriesNovels.value = novels
    contentTitles.value = titles
  } catch (err) {
    console.warn('novel series fetch error', `#${id}`, err)
    error.value = err instanceof Error ? err.message : '未知错误'
  } finally {
    loading.value = false
  }
}

onBeforeRouteUpdate((to) => {
  if (to.name !== 'novel-series') return
  init(to.params.id as string)
})

effect(() => setTitle(series.value?.title, 'Novel Series'))

onMounted(() => {
  init(route.params.id as string)
})
</script>

<style scoped lang="scss">
section {
  padding-top: 1rem;
}

.series-hero {
  display: grid;
  grid-template-columns: minmax(160px, 240px) minmax(0, 1fr);
  gap: clamp(1rem, 3vw, 2rem);
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.cover img {
  width: 100%;
  @include fnb-border;
  @include fnb-shadow;
}

h1 {
  --bg-color: var(--fnb-brand);
  display: inline-block;
  box-shadow: 0 4px 0 var(--bg-color);
  margin: 0 0 1rem;

  &.danger {
    --bg-color: var(--fnb-danger);
  }
}

.meta,
.tags,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.meta span {
  color: var(--fnb-text-muted);
}

.description {
  max-width: 72ch;
  overflow-wrap: anywhere;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 1.5rem;
  align-items: start;
  margin-top: 1rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}

.side-area {
  display: grid;
  gap: 1rem;
}

.quick-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  img {
    width: 2rem;
    height: 2rem;
    @include fnb-border-sm;
  }
}

.title-list {
  list-style: none;
  padding-left: 0;
  display: grid;
  gap: 0;

  li {
    padding: 0.75rem 0;
    border-bottom: 3px solid var(--fnb-divider);
  }

  li:last-child {
    border-bottom: none;
  }

  .unavailable {
    color: var(--fnb-text-muted);
  }
}

.fnb-empty {
  text-align: center;
  color: var(--fnb-text-muted);
  padding: 2rem;
}
</style>
