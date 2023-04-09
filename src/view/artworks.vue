<template lang="pug">
#artwork-view
  //- Loading
  section.align-center(v-if='loading')
    Placeholder
    p {{ '正在读取作品 #' + $route.params.id }}

  //- Done
  section.illust-container(v-if='!error && !loading')
    #top-area
      Gallery(:pages='pages')

      .body-inner
        #meta-area
          .artwork-info
            h1(:class='illust.xRestrict ? "danger" : ""') {{ illust.illustTitle }}
            p.description.pre(v-html='illust.description')
            p.description.no-desc(
              :style='{ color: "#aaa" }'
              v-if='!illust.description'
            ) (无简介)
            p.canonical-link
              a.button(
                :href='illust?.extraData?.meta?.canonical || "#"'
                rel='noopener noreferrer'
                target='_blank'
              ) 在 Pixiv 上查看 →

            p.stats
              span.original(v-if='illust.isOriginal')
                IFaSolidLaughWink(data-icon)
                | 原创
              span.like-count(title='点赞')
                IFaSolidThumbsUp(data-icon)
                | {{ illust.likeCount }}

              //- 收藏
              span.bookmark-count(
                :class='{ bookmarked: illust.bookmarkData }',
                :title='!store.isLoggedIn ? "收藏" : illust.bookmarkData ? "取消收藏" : "添加收藏"'
                @click='illust.bookmarkData ? handleRemoveBookmark() : handleAddBookmark()'
              )
                IFaSolidHeart(data-icon)
                | {{ illust.bookmarkCount }}

              span.view-count(title='浏览')
                IFaSolidEye(data-icon)
                | {{ illust.viewCount }}
              span.count
                IFaSolidImages(data-icon)
                | {{ pages.length }}张

            p.create-date {{ new Date(illust.createDate).toLocaleString() }}

          .artwork-tags
            span.x-restrict(title='R-18' v-if='illust?.xRestrict') R-18
            ArtTag(
              :key='_',
              :tag='item.tag'
              v-for='(item, _) in illust.tags.tags'
            )

        aside#author-area(ref='authorRef')
          .author-info
            h2 作者
            .align-center(v-if='!user.userId')
              Placeholder
            AuthorCard(:user='user' v-if='user.userId')

        Card.comments(ref='commentsRef' title='评论')
          CommentsArea(
            :count='illust.commentCount',
            :id='illust.id || illust.illustId'
          )

    //- 相关推荐
    .recommend-works.body-inner(ref='recommendRef')
      h2 相关推荐
      .align-center.loading(v-if='!recommend.length')
        Placeholder
      ArtworkList(:list='recommend')
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
import Placeholder from '@/components/Placeholder.vue'
import ShowMore from '@/components/ShowMore.vue'

import { getCache, setCache } from './siteCache'
import { ajax } from '@/utils/ajax'

// Types
import type { Artwork, ArtworkInfo, ArtworkGallery, User } from '@/types'

import { useUserStore } from '@/plugins/states'
import {
  addBookmark,
  removeBookmark,
  sortArtList,
} from '@/utils/artworkActions'
import { getElementUntilIntoView } from '@/utils/getElementUntilIntoView'

const loading = ref(true)
const error = ref('')
const illust = ref<Artwork>({} as Artwork)
const pages = ref<ArtworkGallery[]>([])
const user = ref<User>({} as User)
const recommend = ref<ArtworkInfo[]>([])
const recommendNextIds = ref<string[]>([])
const recommendLoading = ref(false)
const bookmarkLoading = ref(false)
const route = useRoute()
const store = useUserStore()

const recommendRef = ref<HTMLElement>()
const authorRef = ref<HTMLElement>()

async function init(id: string): Promise<void> {
  loading.value = true

  // Reset states
  illust.value = {} as any
  pages.value = []
  user.value = {} as any
  recommend.value = []
  recommendNextIds.value = []

  addObserver(recommendRef, () => {
    handleRecommendInit(illust.value.illustId)
  })
  addObserver(authorRef, () => {
    handleUserInit(illust.value.userId)
  })

  const dataCache = getCache(`illust.${id}`)
  const pageCache = getCache(`illust.${id}.page`)
  if (dataCache && pageCache) {
    illust.value = dataCache
    pages.value = pageCache
    loading.value = false
    document.title = `${dataCache.illustTitle} | Artwork | PixivNow`
    return
  }

  try {
    const [{ data: illustData }, { data: illustPage }] = await Promise.all([
      ajax.get<Artwork>(`/ajax/illust/${id}?full=1`),
      ajax.get<ArtworkGallery[]>(`/ajax/illust/${id}/pages`),
    ])
    document.title = `${illustData.illustTitle} | Artwork | PixivNow`
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
  await init(to.params.id as string)
})

onMounted(() => {
  document.title = 'Artwork | PixivNow'
  init(route.params.id as string)
})

function addObserver(elRef: Ref<HTMLElement | undefined>, callback: () => any) {
  const unWatch = watch(loading, async (val) => {
    if (val) return
    await nextTick()
    const el = elRef.value
    if (!el) return console.warn('observer missing target')
    if (illust.value.illustId) {
      unWatch()
      getElementUntilIntoView(el).then(() => {
        callback?.()
      })
    }
  })
}
</script>

<style scoped lang="sass">

.gallery
  margin: 1rem auto

.artwork-tags
  margin: 1rem 0

h1
  // display: inline-block
  box-shadow: none
  background: linear-gradient(90deg, var(--theme-accent-color), rgba(255,255,255,0))
  background-position: 0 1em
  background-repeat: no-repeat
  margin: 0

  &.danger
    background: linear-gradient(90deg, var(--theme-danger-color), rgba(255,255,255,0))
    background-position: 0 1em
    background-repeat: no-repeat

.x-restrict
  font-weight: bold
  color: #c00
  margin-right: 1rem

.stats
  > span, > a
    margin-right: 0.5rem
    color: #aaa

    [data-icon]
      margin-right: 4px

  .original
    color: inherit
    font-weight: 600

  .bookmark-count
    cursor: pointer

    &.bookmarked
      color: var(--theme-bookmark-color)
      font-weight: 600

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
