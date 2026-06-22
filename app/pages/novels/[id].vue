<template lang="pug">
#novel-view
  //- Loading
  section.placeholder(v-if='loading')
    .body-inner
      .novel-hero
        FnbSkeleton(block height='320px' width='220px')
        .novel-main
          h1: FnbSkeleton(height='2rem' width='18rem')
          FnbSkeleton(:repeat='5' text)

  //- Done
  section.novel-container(v-else-if='!error && novel')
    .body-inner
      .novel-hero
        .cover(v-if='novel.coverUrl')
          img(:alt='novel.title' :src='novel.coverUrl')
        .summary
          h1(:class='{ danger: novel.xRestrict }') {{ novel.title }}
          .meta
            span(v-if='novel.xRestrict') R-18
            span(v-if='novel.isOriginal') 原创
            span(v-if='characterLabel') {{ characterLabel }}
            span(v-if='novel.readingTime') {{ Math.ceil(novel.readingTime / 60) }} 分钟
          p.description.pre(v-if='descriptionText') {{ descriptionText }}
          p.description.no-desc(v-else) 作者未填写简介
          .stats
            span.stat-item(title='点赞')
              IFasThumbsUp(aria-hidden='true')
              | {{ novel.likeCount }}
            span.stat-item(title='收藏')
              IFasHeart(aria-hidden='true')
              | {{ novel.bookmarkCount ?? 0 }}
            span.stat-item(title='浏览')
              IFasEye(aria-hidden='true')
              | {{ novel.viewCount }}
          .tags
            ArtTag(
              :key='tag.tag',
              :tag='tag.tag',
              :search-query='{ content: "novels", s_mode: "s_tag_only" }',
              v-for='tag in novel.tags.tags'
            )
          .actions
            FnbButton(size='sm', variant='primary', @click='scrollToReader')
              template(#icon): IFasBookOpen
              | 立即阅读
            FnbButton(
              :href='novel.extraData?.meta?.canonical || `https://www.pixiv.net/novel/show.php?id=${novel.id}`'
              rel='noopener noreferrer'
              size='sm'
              tag='a'
              target='_blank'
            )
              | 前往 Pixiv 查看
              template(#icon)
                IFasArrowRight

    .body-inner.content-grid
      main.reader-area
        Card(title='正文')
          NovelReader#reader(:blocks='contentBlocks', ref='readerRef')

      aside.side-area
        Card(title='作者')
          AuthorCard(:user='user')
        Card(title='系列' v-if='novel.seriesNavData')
          .series-nav
            RouterLink.series-title(:to='`/novel/series/${novel.seriesNavData.seriesId}`') {{ novel.seriesNavData.title }}
            .series-links
              RouterLink(
                v-if='novel.seriesNavData.prev?.available !== false && novel.seriesNavData.prev?.id'
                :to='`/novels/${novel.seriesNavData.prev.id}`'
              ) 上一篇：{{ novel.seriesNavData.prev.title }}
              RouterLink(
                v-if='novel.seriesNavData.next?.available !== false && novel.seriesNavData.next?.id'
                :to='`/novels/${novel.seriesNavData.next.id}`'
              ) 下一篇：{{ novel.seriesNavData.next.title }}
        Card(title='作者的其他小说' v-if='relatedNovels.length')
          NovelList(:list='relatedNovels')

  //- Error
  section.error(v-if='error')
    ErrorPage(:description='error' title='出大问题')
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'novels',
  alias: ['/novel/:id', '/n/:id'],
})
import ArtTag from '~/components/ArtTag.vue'
import AuthorCard from '~/components/AuthorCard.vue'
import Card from '~/components/Card.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import NovelReader from '~/components/Novel/NovelReader.vue'
import IFasArrowRight from '~icons/fa-solid/arrow-right'
import IFasBookOpen from '~icons/fa-solid/book-open'
import IFasEye from '~icons/fa-solid/eye'
import IFasHeart from '~icons/fa-solid/heart'
import IFasThumbsUp from '~icons/fa-solid/thumbs-up'
import { effect } from 'vue'
import { useNovelStore } from '~/stores/novel'
import { useUserProfileStore } from '~/stores/user-profile'
import type { Novel, NovelInfo, User } from '~/types'
import { parseNovelContent, stripHtmlText } from '~/utils/novel-content'
import { setTitle } from '~/utils/setTitle'

const route = useRoute()
const novelStore = useNovelStore()
const userProfileStore = useUserProfileStore()
const readerRef = ref<HTMLElement>()
const loading = ref(true)
const error = ref('')
const novel = ref<Novel>()
const user = ref<User>()

const contentBlocks = computed(() =>
  novel.value
    ? parseNovelContent(novel.value.content, novel.value.textEmbeddedImages)
    : []
)
const descriptionText = computed(() =>
  novel.value?.description ? stripHtmlText(novel.value.description).trim() : ''
)
const characterLabel = computed(() => {
  const current = novel.value
  if (!current) return ''
  const count = current.characterCount || current.textCount
  return count ? `${count} 字` : ''
})
const relatedNovels = computed<NovelInfo[]>(() => {
  const current = novel.value
  if (!current?.userNovels) return []
  return Object.values(current.userNovels)
    .filter((item): item is NovelInfo => !!item && item.id !== current.id)
    .slice(0, 6)
})

function scrollToReader() {
  readerRef.value?.scrollIntoView({ behavior: 'smooth' })
}

async function init(id: string): Promise<void> {
  loading.value = true
  error.value = ''
  novel.value = undefined
  user.value = undefined

  try {
    const novelData = await novelStore.fetchNovel(id)
    novel.value = novelData
    user.value = await userProfileStore.fetchUser(novelData.userId)
  } catch (err) {
    console.warn('novel fetch error', `#${id}`, err)
    error.value = err instanceof Error ? err.message : '未知错误'
  } finally {
    loading.value = false
  }
}

onBeforeRouteUpdate((to) => {
  if (to.name !== 'novels') return
  init(to.params.id as string)
})

effect(() => setTitle(novel.value?.title, 'Novels'))

onMounted(() => {
  init(route.params.id as string)
})
</script>

<style scoped lang="scss">
section {
  padding-top: 1rem;
}

.novel-hero {
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
  box-shadow: 0 2px 0 var(--bg-color);
  margin: 0 0 1rem;

  &.danger {
    --bg-color: var(--fnb-danger);
  }
}

.meta,
.stats,
.tags,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.meta span,
.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--fnb-text-muted);
}

.description {
  max-width: 72ch;
  max-height: 12em;
  overflow-y: auto;
  overflow-wrap: anywhere;
}

.read-now {
  margin-top: 0.25rem;
}

.no-desc {
  color: var(--fnb-text-muted);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
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

.series-nav {
  display: grid;
  gap: 0.75rem;
}

.series-title {
  font-weight: 700;
}

.series-links {
  display: grid;
  gap: 0.5rem;
  font-size: 0.9rem;
}
</style>
