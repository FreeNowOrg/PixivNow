<template lang="pug">
#artwork-view
  //- Loading
  section.align-center(v-if='loading')
    placeholder
    p {{ "正在读取作品 #" + $route.params.id }}

  //- Done
  section.illust-container(v-if='!error && !loading')
    #top-area
      gallery(:pages='illust.pages')

      .body-inner
        #meta-area
          .artwork-info
            h1(:class='illust.xRestrict ? "danger" : ""') {{ illust.illustTitle }}
            p.description.pre(v-html='illust.description')
            p.description.no-desc(
              v-if='!illust.description',
              :style='{ color: "#aaa" }'
            ) (无简介)
            p.canonical-link
              a.button(
                :href='illust?.extraData?.meta?.canonical || "#"',
                target='_blank',
                rel='noopener noreferrer'
              ) 在 Pixiv 上查看 →

            p.stats
              span.original(v-if='illust.isOriginal')
                fa(icon='laugh-wink')
                | 原创
              span.like-count(title='点赞')
                fa(icon='thumbs-up')
                | {{ illust.likeCount }}

              //- 收藏
              //- 未收藏/不可收藏
              span.bookmark-count(
                v-if='!illust.bookmarkData',
                @click='addBookmark',
                :title='userData ? "添加收藏" : "收藏"'
              )
                fa(icon='heart')
                | {{ illust.bookmarkCount }}
              //- 已收藏
              router-link.bookmark-count.bookmarked(
                v-if='illust.bookmarkData',
                :to='"/users/" + userData?.id',
                title='查看收藏'
              )
                fa(icon='heart')
                | {{ illust.bookmarkCount }}

              span.view-count(title='浏览')
                fa(icon='eye')
                | {{ illust.viewCount }}
              span.count
                fa(icon='images')
                | {{ illust.pages.length }}张

            p.create-date {{ new Date(illust.createDate).toLocaleString() }}

          .artwork-tags
            span.x-restrict(v-if='illust.xRestrict', title='R-18') R-18
            art-tag(
              :key='_',
              v-for='(item, _) in illust.tags.tags',
              :tag='item.tag'
            )

        aside#author-area
          .author-info
            h2 作者
            .align-center(v-if='!user.userId')
              placeholder
            author-card(:user='user', v-if='user.userId')

        card.comments(title='评论')
          comments-area(
            :id='illust.id || illust.illustId',
            :count='illust.commentCount'
          )

    //- 相关推荐
    .recommend-works
      h2 相关推荐
      .align-center.loading(v-if='!recommend.length')
        placeholder
      artworks-list(:list='recommend')
        .illust-card.load-more(
          v-if='recommendNextIds.length',
          @click='getMoreRecommend',
          :style='{ cursor: "pointer" }'
        )
          .top
            div(
              :style='{ width: "100%", paddingTop: "28%", paddingBottom: "28%", backgroundColor: "#efefef", textAlign: "center" }'
            )
              fa(v-if='!recommendLoading', icon='ellipsis-h', size='5x')
              fa(v-if='recommendLoading', spin, icon='spinner', size='5x')
          .bottom
            .title 推荐作品
            .author(:style='{ fontSize: "small" }') 点击这里，发现更多相关作品！
      show-more(
        v-if='recommendNextIds.length',
        :text='recommendLoading ? "加载中" : "加载更多"',
        :method='getMoreRecommend',
        :loading='recommendLoading'
      )

  //- Error
  section.error(v-if='error')
    error-page(title='出大问题', :description='error')
</template>

<script lang="ts" setup>
import axios from 'axios'
import { API_BASE } from '../config'
import { userData } from '../components/userData'

import AuthorCard from '../components/AuthorCard.vue'
import ArtTag from '../components/ArtTag.vue'
import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import Card from '../components/Card.vue'
import CommentsArea from '../components/Comment/CommentsArea.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Gallery from '../components/Gallery.vue'
import Placeholder from '../components/Placeholder.vue'
import ShowMore from '../components/ShowMore.vue'
import { getCache, setCache } from './siteCache'

// Types
import type { Artwork, ArtworkReduced, User } from '../types'

import { onMounted, ref } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const loading = ref(true)
const error = ref('')
const illust = ref<Artwork>({} as Artwork)
const user = ref<User>({} as User)
const recommend = ref<ArtworkReduced[]>([])
const recommendNextIds = ref<string[]>([])
const recommendLoading = ref(false)
const bookmarkLoading = ref(false)
const route = useRoute()

function init(id: string): void {
  const cache = getCache(`illust.${id}`)
  if (cache) {
    illust.value = cache
    loading.value = false
    document.title = `${cache.illustTitle} | Artwork | PixivNow`
    getUser(cache.userId)
    getFirstRecommend(id)
    return
  }

  axios.get(`${API_BASE}/api/illust/${id}`, {
    params: { full: 1 }
  })
    .then(({ data }: { data: any }) => {
      document.title = `${data.illustTitle} | Artwork | PixivNow`
      setCache(`illust.${id}`, data)
      illust.value = data
      getUser(data.userId)
      getFirstRecommend(id)
    })
    .catch((err) => {
      console.warn('illust fetch error', `#${id}`, err)
      error.value =
        err?.response?.data?.message || err.message || 'HTTP 请求超时'
    })
    .finally(() => loading.value = false)
}

function getUser(userId: string): void {
  if (getCache(`user.${userId}`)) {
    user.value = getCache(`user.${userId}`)
    return
  }

  axios.get(`${API_BASE}/ajax/user/${userId}`)
    .then(({ data }) => {
      user.value = data
      setCache(`user.${userId}`, data)
    })
    .catch((err) => {
      console.warn('User fetch error', err)
    })
}

function getFirstRecommend(id: string): void {
  if (recommendLoading.value) return
  recommendLoading.value = true
  console.log('init recommend')
  axios.get(`${API_BASE}/ajax/illust/${id}/recommend/init`, {
    params: { limit: 17 }
  })
    .then(({ data }) => {
      recommend.value = data.illusts
      recommendNextIds.value = data.nextIds
    })
    .catch((err) => {
      console.warn('recommend fetch error', err)
    })
    .finally(() => recommendLoading.value = false)
}

function getMoreRecommend(): void {
  if (recommendLoading.value) return
  recommendLoading.value = true
  console.log('get more recommended')
  if (!recommendNextIds.value.length) {
    console.log('no more recommended')
    return
  }
  const requestIds = recommendNextIds.value.splice(0, 18)

  axios
    .get(`${API_BASE}/ajax/illust/recommend/illusts`, {
      params: { illust_ids: requestIds }
    })
    .then(({ data }) => {
      recommend.value = recommend.value.concat(data.illusts)
      recommendNextIds.value = recommendNextIds.value.concat(data.nextIds)
    })
    .catch((err) => {
      console.warn('recommend fetch error', err)
    })
    .finally(() => recommendLoading.value = false)
}

function addBookmark(): void {
  if (!userData) return console.log('需要登录才可以添加收藏')
  if (illust.value.isBookmarkable) {
    console.log('无法添加收藏。')
    return
  }
  if (illust.value.bookmarkData) {
    console.log('已经收藏过啦。')
    return
  }
  if (bookmarkLoading.value) return
  bookmarkLoading.value = true
  axios.post(`${API_BASE}/ajax/illust/bookmarks/add`, {
    illust_id: illust.value.illustId,
    restrict: illust.value.restrict,
    comment: '',
    tags: [],
  })
    .then(({ data }) => {
      if (data.last_bookmark_id) {
        illust.value.bookmarkData = data
        illust.value.bookmarkCount++
      }
    })
    .catch((err) => {
      console.warn('bookmark add error', err)
    })
    .finally(() => bookmarkLoading.value = false)
}

onBeforeRouteUpdate((to) => {
  init(to.params.id as string)
})

onMounted(() => {
  document.title = 'Artwork | PixivNow'
  init(route.params.id as string)
})
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
</style>
