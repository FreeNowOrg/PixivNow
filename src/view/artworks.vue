<template lang="pug">
#artwork-view
  //- Loading
  section.placeholder(v-if='loading')
    .gallery
      NSkeleton(
        :sharp='false'
        block
        height='50vh'
        style='margin: 0 auto; width: 500px; max-width: 80vw'
      )
    .body-inner
      .artwork-info
        h1.loading(style='padding: 0.5rem 0'): NSkeleton(
          height='2rem'
          style='margin-top: 1em'
          width='20rem'
        )
        Card(title='')
          p.description: NSkeleton(:repeat='4' text)
          p.stats: span(v-for='_ in 4')
            NSkeleton(circle height='1em' text width='1em')
            NSkeleton(style='margin-left: 0.5em' text width='4em')
          p.create-date: NSkeleton(text width='12em')
          p.canonical-link: NSkeleton(height='1.5rem' width='8rem')
        h2: NSkeleton(height='2rem' width='8rem')
        Card(title='')
          AuthorCard
        h2: NSkeleton(height='2rem' width='8rem')
        NSkeleton(:sharp='false' height='8rem' width='100%')

  //- Done
  section.illust-container(v-if='!error && illust')
    #top-area
      .align-center(:style='{ marginBottom: "1rem" }' v-if='isUgoira')
        UgoiraViewer(:illust='illust')
      Gallery(:pages='pages' v-else)

      .body-inner
        #meta-area
          h1(:class='illust.xRestrict ? "danger" : ""') {{ illust.illustTitle }}
          Card(title='')
            .artwork-info
              p.description.pre(v-html='illust.description')
              p.description.no-desc(
                :style='{ color: "#aaa" }'
                v-if='!illust.description'
              ) (作者未填写简介)

              p.stats
                span.like-count(title='点赞')
                  IFasThumbsUp(data-icon)
                  | {{ illust.likeCount }}

                //- 收藏
                span.bookmark-count(
                  :class='{ bookmarked: illust.bookmarkData }',
                  :title='!store.isLoggedIn ? "收藏" : illust.bookmarkData ? "取消收藏" : "添加收藏"'
                  @click='illust?.bookmarkData ? handleRemoveBookmark() : handleAddBookmark()'
                )
                  IFasHeart(data-icon)
                  | {{ illust.bookmarkCount }}

                span.view-count(title='浏览')
                  IFasEye(data-icon)
                  | {{ illust.viewCount }}
                span.count
                  IFasImages(data-icon)
                  | {{ pages.length }}张

              p.create-date {{ new Date(illust.createDate).toLocaleString() }}

            .artwork-tags
              span.original-tag(v-if='illust.isOriginal')
                IFasLaughWink(data-icon)
                | 原创
              span.restrict-tag.x-restrict(
                title='R-18'
                v-if='illust?.xRestrict'
              ) R-18
              span.restrict-tag.ai-restrict(
                :title='`AI生成 (${illust.aiType})`'
                v-if='illust?.aiType === 2'
              ) AI生成
              ArtTag(
                :key='_',
                :tag='item.tag'
                v-for='(item, _) in illust.tags.tags'
              )

            .canonical-link
              NButton(
                :href='illust?.extraData?.meta?.canonical || "#"'
                icon-placement='right'
                rel='noopener noreferrer'
                size='small'
                tag='a'
                target='_blank'
              )
                template(#icon)
                  IFasArrowRight
                | 前往 Pixiv 查看

        aside.author-area(ref='authorRef')
          Card(title='作者')
            AuthorCard(:user='user')

        Card.comments(title='评论')
          CommentsArea(
            :count='illust.commentCount',
            :id='illust.id || illust.illustId'
          )

    //- 相关推荐
    .recommend-works.body-inner(ref='recommendRef')
      h2 相关推荐
      ArtworkList(:list='recommend', :loading='!recommend.length')
      ShowMore(
        :loading='recommendLoading',
        :method='handleMoreRecommend',
        :text='recommendLoading ? "加载中" : "加载更多"'
        v-if='recommend.length && recommendNextIds.length'
      )

  //- Error
  section.error(v-if='error')
    ErrorPage(:description='error' title='出大问题')
</template>

<script lang="ts" setup>
import ArtTag from '@/components/ArtTag.vue'
import ArtworkList from '@/components/ArtworksList/ArtworkList.vue'
import AuthorCard from '@/components/AuthorCard.vue'
import Card from '@/components/Card.vue'
import CommentsArea from '@/components/Comment/CommentsArea.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Gallery from '@/components/Gallery.vue'
import ShowMore from '@/components/ShowMore.vue'
import IFasArrowRight from '~icons/fa-solid/arrow-right'
import IFasEye from '~icons/fa-solid/eye'
import IFasHeart from '~icons/fa-solid/heart'
import IFasImages from '~icons/fa-solid/images'
import IFasLaughWink from '~icons/fa-solid/laugh-wink'
import IFasThumbsUp from '~icons/fa-solid/thumbs-up'

import { getCache, setCache } from './siteCache'
import { ajax } from '@/utils/ajax'

// Types
import type { Artwork, ArtworkInfo, ArtworkGallery, User } from '@/types'

import { useUserStore } from '@/composables/states'
import {
  addBookmark,
  removeBookmark,
  sortArtList,
} from '@/utils/artworkActions'
import { NButton, NSkeleton } from 'naive-ui'
import { effect } from 'vue'
import { setTitle } from '@/utils/setTitle'

const loading = ref(true)
const error = ref('')
const illust = ref<Artwork>()
const pages = ref<ArtworkGallery[]>([])
const user = ref<User>()
const recommend = ref<ArtworkInfo[]>([])
const recommendNextIds = ref<string[]>([])
const recommendLoading = ref(false)
const bookmarkLoading = ref(false)
const route = useRoute()
const store = useUserStore()

const recommendRef = ref<HTMLDivElement | null>(null)
const authorRef = ref<HTMLElement>()

const isUgoira = computed(() => illust.value?.illustType === 2)
const UgoiraViewer = defineAsyncComponent({
  loader: () => import('@/components/UgoiraViewer.vue'),
  loadingComponent: () =>
    h('svg', {
      width: illust.value?.width,
      height: illust.value?.height,
      style: {
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '60vh',
        borderRadius: '4px',
        backgroundColor: '#e8e8e8',
      },
    }),
})

function addObserver(elementRef: Ref, cb: () => any) {
  const unWatch = watch(loading, async (val) => {
    console.log(loading.value)
    if (val) return
    await nextTick()
    if (illust.value?.illustId) {
      unWatch()
      const ob = useIntersectionObserver(
        elementRef.value,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            cb()
            ob.stop()
          }
        }
      )
    }
  })
}

async function init(id: string): Promise<void> {
  loading.value = true

  // Reset states
  illust.value = undefined
  pages.value = []
  user.value = undefined
  recommend.value = []
  recommendNextIds.value = []

  addObserver(recommendRef, () => handleRecommendInit(illust.value!.illustId))
  addObserver(authorRef, () => handleUserInit(illust.value!.userId))

  const dataCache = getCache(`illust.${id}`)
  const pageCache = getCache(`illust.${id}.page`)
  if (dataCache && pageCache) {
    illust.value = dataCache
    pages.value = pageCache
    loading.value = false
    return
  }

  try {
    const [{ data: illustData }, { data: illustPage }] = await Promise.all([
      ajax.get<Artwork>(`/ajax/illust/${id}?full=1`),
      ajax.get<ArtworkGallery[]>(`/ajax/illust/${id}/pages`),
    ])
    setCache(`illust.${id}`, illustData)
    setCache(`illust.${id}.page`, illustPage)
    illust.value = illustData
    pages.value = illustPage
  } catch (err) {
    console.warn('illust fetch error', `#${id}`, err)
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '未知错误'
    }
  } finally {
    loading.value = false
  }
}

async function handleUserInit(userId: string): Promise<void> {
  const value = getCache(`user.${userId}`)
  if (value) {
    user.value = value
    return
  }

  try {
    const [{ data: userData }, { data: profileData }] = await Promise.all([
      axios.get<User>(`/ajax/user/${userId}?full=1`),
      axios.get<{ illusts: Record<string, ArtworkInfo> }>(
        `/ajax/user/${userId}/profile/top`
      ),
    ])
    const { illusts } = profileData
    const userValue = {
      ...userData,
      illusts: sortArtList(illusts),
    }
    user.value = userValue
    setCache(`user.${userId}`, userValue)
  } catch (err) {
    console.warn('User fetch error', err)
  }
}

async function handleRecommendInit(id: string): Promise<void> {
  if (recommendLoading.value) return
  try {
    recommendLoading.value = true
    console.log('init recommend')
    const { data } = await ajax.get<{
      illusts: ArtworkInfo[]
      nextIds: string[]
    }>(`/ajax/illust/${id}/recommend/init?limit=18`)
    recommend.value = data.illusts
    recommendNextIds.value = data.nextIds
  } catch (err) {
    console.error('recommend fetch error', err)
  } finally {
    recommendLoading.value = false
  }
}
async function handleMoreRecommend(): Promise<void> {
  if (recommendLoading.value) return
  if (!recommendNextIds.value.length) {
    console.log('no more recommend')
    return
  }

  try {
    recommendLoading.value = true
    console.log('get more recommend')
    const requestIds = recommendNextIds.value.splice(0, 18)
    const searchParams = new URLSearchParams()
    for (const id of requestIds) {
      searchParams.append('illust_ids', id)
    }
    const { data } = await ajax.get<{
      illusts: ArtworkInfo[]
      nextIds: string[]
    }>('/ajax/illust/recommend/illusts', { params: searchParams })
    recommend.value = recommend.value.concat(data.illusts)
    recommendNextIds.value = recommendNextIds.value.concat(data.nextIds)
  } catch (err) {
    console.error('recommend fetch error', err)
  } finally {
    recommendLoading.value = false
  }
}

async function handleAddBookmark(): Promise<void> {
  if (!illust.value) return
  if (!store.isLoggedIn) {
    console.log('需要登录才可以添加收藏')
    return
  }
  if (!illust.value.isBookmarkable) {
    console.log('无法添加收藏')
    return
  }
  if (illust.value.bookmarkData) {
    console.log('已经收藏过啦')
    return
  }
  if (bookmarkLoading.value) return
  try {
    bookmarkLoading.value = true
    const data = await addBookmark(illust.value.illustId)
    if (data.last_bookmark_id) {
      illust.value.bookmarkData = {
        id: data.last_bookmark_id,
        private: false,
      }
      illust.value.bookmarkCount++
    }
  } catch (err) {
    console.error('bookmark add error:', err)
  } finally {
    bookmarkLoading.value = false
  }
}
async function handleRemoveBookmark(): Promise<void> {
  if (!illust.value) return
  if (bookmarkLoading.value || !illust.value.bookmarkData) return
  try {
    bookmarkLoading.value = true
    await removeBookmark(illust.value.bookmarkData.id)
    illust.value.bookmarkData = null
    illust.value.bookmarkCount--
  } catch (err) {
    console.error('bookmark remove failed:', err)
  } finally {
    bookmarkLoading.value = false
  }
}

onBeforeRouteUpdate(async (to) => {
  if (to.name !== 'artworks') {
    return
  }
  init(to.params.id as string)
})

effect(() => setTitle(illust.value?.illustTitle, 'Artworks'))

onMounted(() => {
  init(route.params.id as string)
})
</script>

<style scoped lang="sass">
section
  padding-top: 1rem

.gallery
  margin: 0 auto

.artwork-tags
  margin: 1rem 0
  > span
    font-weight: 700
    margin-right: 1rem

h1
  --bg-color: var(--theme-accent-color)
  box-shadow: 0 2px 0 var(--bg-color)
  margin: 0
  margin-bottom: 1rem
  &.danger
    --bg-color: var(--theme-danger-color)
  &.loading
    --bg-color: rgba(0, 0, 0, .08)
    opacity: 0.85

.original-tag
  color: #e02080
.x-restrict
  color: #c00
.ai-restrict
  color: #c70

.stats
  > span, > a
    margin-right: 0.5rem
    color: #aaa

    [data-icon]
      margin-right: 4px

  .bookmark-count
    cursor: pointer

    &.bookmarked
      color: var(--theme-bookmark-color)
      font-weight: 700

.create-date
  color: #aaa
  font-size: 0.85rem

.breadcrumb
  margin-top: 1rem

.user-illusts
  ul
    margin-left: -1rem
    margin-right: -1rem
    background-color: var(--theme-background-color)

.load-more
  a.plain
    color: var(--theme-text-color)
    cursor: pointer

  .top .inner
    border-radius: 8px
    width: 100%
    padding: 28% 0
    background-color: var(--theme-box-shadow-color)
    text-align: center

  .bottom .author
    font-size: 0.8rem
</style>
