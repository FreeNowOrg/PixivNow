<template lang="pug">
#artwork-view
  //- Loading
  section.align-center(v-if='loading')
    placeholder
    p {{ '正在读取作品 #' + $route.params.id }}

  //- Done
  section.illust-container(v-if='!error && !loading')
    #top-area
      gallery(:pages='pages')

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
                i-fa-solid-laugh-wink(data-icon)
                | 原创
              span.like-count(title='点赞')
                i-fa-solid-thumbs-up(data-icon)
                | {{ illust.likeCount }}

              //- 收藏
              span.bookmark-count(
                :class='{ bookmarked: illust.bookmarkData }',
                :title='!store.isLoggedIn ? "收藏" : illust.bookmarkData ? "取消收藏" : "添加收藏"'
                @click='illust.bookmarkData ? handleRemoveBookmark() : handleAddBookmark()'
              )
                i-fa-solid-heart(data-icon)
                | {{ illust.bookmarkCount }}

              span.view-count(title='浏览')
                i-fa-solid-eye(data-icon)
                | {{ illust.viewCount }}
              span.count
                i-fa-solid-images(data-icon)
                | {{ pages.length }}张

            p.create-date {{ new Date(illust.createDate).toLocaleString() }}

          .artwork-tags
            span.x-restrict(title='R-18' v-if='illust?.xRestrict') R-18
            art-tag(
              :key='_',
              :tag='item.tag'
              v-for='(item, _) in illust.tags.tags'
            )

        aside#author-area(ref='authorRef')
          .author-info
            h2 作者
            .align-center(v-if='!user.userId')
              placeholder
            author-card(:user='user' v-if='user.userId')

        card.comments(ref='commentsRef' title='评论')
          comments-area(
            :count='illust.commentCount',
            :id='illust.id || illust.illustId'
          )

    //- 相关推荐
    .recommend-works.body-inner(ref='recommendRef')
      h2 相关推荐
      .align-center.loading(v-if='!recommend.length')
        placeholder
      artwork-list(:list='recommend')
      show-more(
        :loading='recommendLoading',
        :method='async () => await getMoreRecommend()',
        :text='recommendLoading ? "加载中" : "加载更多"'
        v-if='recommendNextIds.length'
      )

  //- Error
  section.error(v-if='error')
    error-page(:description='error' title='出大问题')
</template>

<script lang="ts" setup>
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

async function init(id: string): Promise<void> {
  loading.value = true
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

const authorRef = ref<HTMLElement>()
addObserver(authorRef, () => {
  getUser(illust.value.userId)
})
async function getUser(userId: string): Promise<void> {
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

async function getFirstRecommend(id: string): Promise<void> {
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

async function getMoreRecommend(): Promise<void> {
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

const recommendRef = ref<HTMLElement>()
addObserver(recommendRef, () => {
  getFirstRecommend(illust.value.illustId)
})

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

onMounted(async () => {
  document.title = 'Artwork | PixivNow'
  await init(route.params.id as string)
})

function addObserver(elRef: Ref<HTMLElement | undefined>, callback: () => any) {
  let observer: IntersectionObserver
  onMounted(() => {
    observer = new IntersectionObserver(([entry]) => {
      console.info(entry.isIntersecting, illust.value?.illustId)
      if (entry.isIntersecting && illust.value?.illustId) {
        observer.disconnect()
        callback?.()
        console.info('INTO VIEW', entry)
      }
    })
    const unWatch = watch(loading, async (val) => {
      if (val) return
      await nextTick()
      const el = elRef.value
      if (!el) return console.warn('observer missing target')
      if (illust.value.illustId) {
        unWatch()
        observer.observe(el)
      }
    })
  })
  onBeforeUnmount(() => {
    observer && observer.disconnect()
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
