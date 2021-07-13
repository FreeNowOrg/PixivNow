<template lang="pug">

//- Loading
section.align-center(v-if="loading")
  placeholder

//- Done
section.illust-container(v-if="!error && !loading")
  gallery(:pages="illust.pages")
  
  card
    h1(:class="illust.xRestrict ? 'danger' : ''") {{ illust.illustTitle }}
    p.description.pre(v-html="illust.description")

    p.stats
      span.isOriginal(v-if="illust.isOriginal")
        fa(icon="laugh-wink")
        | 原创
      span.likeCount(title="点赞")
        fa(icon="thumbs-up")
        | {{ illust.likeCount }}
      span.bookmarkCount(title="收藏")
        fa(icon="heart")
        | {{ illust.bookmarkCount }}
      span.viewCount(title="浏览")
        fa(icon="eye")
        | {{ illust.viewCount }}

    p.createDate {{ new Date(illust.createDate).toLocaleString() }}

    .align-center
      a.button(
        :href="illust?.extraData?.meta?.canonical || '#'"
        target="_blank"
        rel="noopener noreferrer"
      ) 在 Pixiv 上查看 →

  .tags
    span.xRestrict(v-if="illust.xRestrict" title="R-18") R-18
    art-tag(:key="_" v-for="(item, _) in illust.tags.tags" :tag="item.tag")
  
  .author
    h2 作者
    .loading(v-if="!user.userId")
      placeholder
    author-card(:user="user" v-if="user.userId")

  card.comments(title="评论")
    p(v-if="!comments.length && !commentsLoading") 评论区空空如也……
    .align-center(v-if="!comments.length && commentsLoading")
      placeholder
    ul.commentsList(v-if="comments.length")
      comment(v-for="comment in comments" :comment="comment")
      .showMore.align-center
        a.button(
          v-if="comments.length && commentsHasNext"
          @click="getComments(illust.id)"
        )
          | {{ commentsLoading ? '正在加载' : '查看更多' }}
          | &nbsp;
          fa(
            :icon="commentsLoading ? 'spinner' : 'plus'"
            :spin="commentsLoading")

  .userIllusts
    h2 用户作品
    artworks-list.inline(:list="illust?.userIllusts")

  //- 相关推荐
  .recommendWorks
    h2 相关推荐
    artworks-list(:list="recommend")
      .illustCard.loadMore(
        v-if="recommendNextIds.length"
        @click="getRecommend"
        :style="{cursor: 'pointer'}"
        )
        .top
          div(:style="{width: '100%', paddingTop: '35%', paddingBottom: '35%', backgroundColor: '#efefef', textAlign: 'center'}")
            fa(
              v-if="!recommendLoading"
              icon="ellipsis-h"
              size="5x")
            fa(
              v-if="recommendLoading"
              spin
              icon="spinner"
              size="5x")
        .bottom
          h3.title 推荐作品
          p 点击这里，发现更多相关作品！
    show-more(
      v-if="recommendNextIds.length"
      :text="recommendLoading ? '加载中' : '加载更多'"
      :method="getRecommend"
      :loading="recommendLoading"
      )

//- Error
section.error(v-if="error")
  error-page(title="出大问题" :description="error")
</template>

<script lang="ts">
import axios from 'axios'
import { API_BASE } from '../config'
import { userData } from '../components/userData'

import AuthorCard from '../components/AuthorCard.vue'
import ArtTag from '../components/ArtTag.vue'
import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import Card from '../components/Card.vue'
import Comment from '../components/Comment/Comment.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Gallery from '../components/Gallery.vue'
import Placeholder from '../components/Placeholder.vue'
import ShowMore from '../components/ShowMore.vue'
import { getCache, setCache } from './siteCache'

// Types
export interface ArtworkUrls {
  mini: string
  thumb: string
  small: string
  regular: string
  original: string
}
export interface ArtworkTag {
  tag: string
  locked: boolean
  deletable: boolean
  userId: `${number}`
  translation?: {
    en?: string
  }
  userName: string
}
export interface Artwork {
  illustId?: `${number}`
  illustTitle?: string
  illustComment?: string
  id: `${number}`
  title: string
  illustType: 0
  xRestrict: 0 | 1 | 2
  restrict: 0
  sl: 2
  url: string
  urls?: ArtworkUrls
  pages?: { urls: ArtworkUrls; width: number; height: number }[]
  description: string
  tags:
    | {
        authorId: `${number}`
        isLocked: boolean
        tags: ArtworkTag[]
      }
    | string[]
  storableTags?: string[]
  userId: `${number}`
  userName: string
  userAccount?: string
  userIllusts: Record<string, Artwork | null>
  likeData: boolean
  width: number
  height: number
  pageCount: number
  bookmarkCount: number
  likeCount: number
  commentCount: number
  responseCount: number
  viewCount: number
  isHowto: boolean
  isOriginal: boolean
  imageResponseOutData: any[]
  imageResponseData: any[]
  imageResponseCount: number
  pollData: any
  seriesNavData: any
  descriptionBoothId: any
  descriptionYoutubeId: any
  comicPromotion: any
  fanboxPromotion: any
  contestBanners: any[]
  isBookmarkable: boolean
  contestData: any
  bookmarkData?: {
    id: `${number}`
    private: boolean
  } | null
  alt: string
  titleCaptionTranslation: {
    workTitle: string
    workCaption: string
  }
  createDate: string
  updateDate: string
  isUnlisted: boolean
  isMasked: boolean
  profileImageUrl: string
  type: 'illust' | 'novel'
  zoneConfig?: any
  extraData?: {
    meta: {
      title: string
      description: string
      canonical: string
      alternateLanguages: {
        ja: string
        en: string
      }
      descriptionHeader: string
      ogp: {
        description: string
        image: string
        title: string
        type: string
      }
      twitter: {
        description: string
        image: string
        title: string
        card: string
      }
    }
  }
  noLoginData?: {
    breadcrumbs: {
      successor: any[]
      current: {
        zh?: string
      }
    }
    zengoIdWorks: Artwork[]
    zengoWorkData: {
      nextWork: {
        id: `${number}`
        title: string
      }
      prevWork: {
        id: `${number}`
        title: string
      }
    }
  }
}

export default {
  data() {
    return {
      loading: true,
      illust: {},
      user: {},
      comments: [] as any[],
      commentsLoading: false,
      commentsHasNext: true,
      recommend: [] as Artwork[],
      recommendLoading: false,
      recommendNextIds: [] as string[],
      error: '',
      userData,
    }
  },
  components: {
    AuthorCard,
    ArtTag,
    ArtworksList,
    Card,
    Comment,
    ErrorPage,
    Gallery,
    Placeholder,
    ShowMore,
  },
  methods: {
    async init(id: string) {
      // 初始化
      this.user = {}
      this.comments = []
      this.recommend = []
      this.recommendNextIds = []
      this.loading = true

      // Cache
      const cache = getCache(`illust.${id}`)
      if (cache) {
        this.illust = cache
        this.loading = false
        document.title = `${cache.illustTitle} | Artwork | PixivNow`
        // Extra
        this.getUser(cache.userId)
        this.getComments(id)
        this.getRecommend(id)
        return
      }

      axios
        .get(`${API_BASE}/api/illust/${id}`, {
          params: {
            full: 1,
          },
        })
        .then(
          ({ data }: { data: Artwork }) => {
            document.title = `${data.illustTitle} | Artwork | PixivNow`
            setCache(`illust.${id}`, data)
            this.illust = data

            // Extra
            this.getUser(data.userId)
            this.getComments(data.id)
            this.getRecommend(id)
          },
          (err) => {
            console.warn('illust fetch error', `#${id}`, err)
            this.error =
              err?.response?.data?.message || err.message || 'HTTP 请求超时'
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
    async getUser(userId: string) {
      if (getCache(`users.${userId}`)) {
        this.user = getCache(`users.${userId}`)
        return
      }

      axios.get(`${API_BASE}/api/user/${userId}`).then(
        ({ data }) => {
          setCache(`users.${userId}`, data)
          this.user = data
        },
        (err) => {
          console.warn('User fetch error', err)
        }
      )
    },
    async getComments(id: string | number) {
      if (this.commentsLoading) return
      this.commentsLoading = true

      axios
        .get(`${API_BASE}/ajax/illusts/comments/roots`, {
          params: {
            illust_id: isNaN(Number(id)) ? (this.illust as Artwork).id : id,
            limit: this.comments.length ? 30 : 3,
            offset: this.comments.length,
          },
        })
        .then(
          ({ data }) => {
            console.log('Comments', data)
            this.commentsHasNext = data.hasNext
            this.comments = [...this.comments, ...data.comments]
          },
          (err) => {
            console.warn('Comments fetch error', err)
          }
        )
        .finally(() => {
          this.commentsLoading = false
        })
    },
    async getRecommend(id: string) {
      if (this.recommendLoading) return
      this.recommendLoading = true

      if (this.recommend.length < 1) {
        // Init
        console.log('init recommend')
        axios
          .get(`${API_BASE}/ajax/illust/${id}/recommend/init`, {
            params: {
              limit: 18,
            },
          })
          .then(
            ({ data }) => {
              this.recommend = data.illusts
              this.recommendNextIds = data.nextIds
            },
            (err) => {
              console.warn('Get recommend error', err)
            }
          )
          .finally(() => {
            this.recommendLoading = false
          })
      } else {
        console.log('get more recommend')
        // Loadmore
        let requestIds: any[] = []
        for (let i = 0; i < 18; i++) {
          if (this.recommendNextIds.length > 0) {
            requestIds.push(this.recommendNextIds.shift())
          }
        }
        axios
          .get(`${API_BASE}/ajax/illust/recommend/illusts`, {
            params: {
              illust_ids: requestIds,
            },
          })
          .then(
            ({ data }) => {
              this.recommend = [...this.recommend, ...data.illusts]
            },
            (err) => {
              console.warn('Load more recommends error', err)
              this.recommendNextIds.unshift(...(requestIds as never[]))
            }
          )
          .finally(() => {
            this.recommendLoading = false
          })
      }
    },
  },
  beforeRouteUpdate(to, from) {
    this.init(to.params.id as string)
  },
  mounted() {
    document.title = 'Artwork | PixivNow'
    this.init(this.$route.params.id as string)
  },
}
</script>

<style scoped lang="sass">
.gallery
  margin: 1rem auto

.tags
  margin: 1rem 0

h1
  // box-shadow: none
  display: inline-block
  margin: 0

  &.danger
    box-shadow: 0 -0.5em 0 #f55 inset

.xRestrict
  font-weight: bold
  color: #c00
  margin-right: 1rem

.stats
  > span
    margin-right: 0.5rem
    color: #aaa

    [data-icon]
      margin-right: 4px
.createDate
  color: #aaa
  font-size: 0.85rem

.breadCrumb
  margin-top: 1rem

.commentsList
  list-style: none
  padding-left: 0
  // max-height: 400px
  // overflow-y: auto
</style>
