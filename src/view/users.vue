<template lang="pug">

//- Loading
section.loading(v-if="loading")
  placeholder
  p {{ loading ? '正在读取用户 #' + $route.params.id : '“' + user.name + '”的空间' }}

//- Error
section.error(v-if="error")
  error-page(title="出大问题" :description="error")

//- :)
section.user(v-if="!loading && !error")
  .userInfo
    .bgArea
      .bgContainer(:style="{backgroundImage: 'url(' + API_BASE + user?.background?.url + ')'}")
        span(v-if="!user.background") 用户未设置封面~
    .avatarArea
      a(:href="API_BASE + user.imageBig" title="查看头像")
        img(:src="API_BASE + user.imageBig")
    .infoArea
      .username {{ user.name }}
      .following
        strong {{ user.following }}
        | &nbsp;已关注
      .gender(v-if="user.gender.name") 
        fa(icon="venus-mars")
        | {{ user.gender.name }}
      .birthday(v-if="user.birthDay.name")
        fa(icon="birthday-cake")
        | {{ user.birthDay.name }}
      .region(v-if="user.region.name")
        fa(icon="map-marker-alt")
        | {{ user.region.name }}
      .webpage(v-if="user.webpage")
        fa(icon="home")
        a(
          :href="user.webpage"
          target="_blank"
          rel="noopener noreferrer"
          ) {{ user.webpage }}
      .comment.pre {{ user.comment }}
      .more
        a(@click="userMore" href="javascript:;") 查看更多
  
  .tabber
    ul.tabBtn
      li(
        @click="tab = 'illust'")
        a(:class="{tabActive: tab === 'illust'}") 插画
      li(
        @click="tab = 'manga'")
        a(:class="{tabActive: tab === 'manga'}") 漫画
      li(
        v-if="userData && userData.id === user.id"
        @click="tab = 'bookmarks'")
        a(:class="{tabActive: tab === 'bookmarks'}") 收藏
    .tabContents
      section(v-if="tab === 'illust'")
        h2(v-if="user.illusts.length") 插画
        artworks-list.inline(:list="user.illusts")
      section(v-if="tab === 'manga'")
        h2(v-if="user.manga.length") 漫画
        artworks-list.inline(:list="user.manga")
      section(v-if="tab === 'bookmarks'")
        h2 收藏
        artworks-list(:list="bookmarks")
</template>

<script lang="ts">
import axios from 'axios'
import { API_BASE } from '../config'
import { userData } from '../components/userData'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'

import { Artwork } from './artworks.vue'
import { getCache, setCache } from './siteCache'

// Types
export type UserPrivacyLevel = '0' | '1' | '2'
export interface User {
  userId: `${number}`
  name: string
  image: string
  imageBig: string
  premium: boolean
  isFollowed: boolean
  isMypixiv: boolean
  isBlocking: boolean
  background: {} | null
  sketchLiveId: {} | null
  partial: number
  acceptRequest: boolean
  sketchLives: any[]
  following: number
  followedBack: boolean
  comment: string
  commentHtml: string
  webpage: string | null
  social: any[]
  region: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  birthDay: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  gender: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  job: {
    name: string
    privacyLevel: UserPrivacyLevel
  } | null
  workspace: {
    userWorkspacePc: string
    userWorkspaceMonitor: string
    userWorkspaceTool: string
    userWorkspaceScanner: string
    userWorkspaceTablet: string
    userWorkspaceMouse: string
    userWorkspacePrinter: string
    userWorkspaceDesktop: string
    userWorkspaceMusic: string
    userWorkspaceDesk: string
    userWorkspaceChair: string
  }
  official: boolean
  group: null
  illusts: Artwork[]
  novels: Artwork[]
}

export default {
  components: {
    ArtworksList,
    ErrorPage,
    Placeholder,
  },
  data() {
    return {
      API_BASE,
      loading: true,
      error: '',
      user: {},
      userData,
      bookmarks: [],
      tab: 'illust',
    }
  },
  methods: {
    init(id: any) {
      // 初始化
      this.user = {}
      this.bookmarks = []
      this.tab = 'illust'
      this.loading = true

      // Cache
      const cache = getCache(`users.${id}`)
      if (cache) {
        this.loading = false
        this.user = cache
        document.title = `${cache.name} | User | PixivNow`
        // Extra
        this.getBookmarks()
        return
      }

      axios
        .get(`${API_BASE}/api/user/${id}`)
        .then(
          ({ data }: { data: User }) => {
            this.user = data
            setCache(`users.${id}`, data)
            document.title = `${data.name} | User | PixivNow`

            this.getBookmarks()
          },
          (err) => {
            console.warn('user', err.response)
            this.error =
              err?.response?.data?.message || err.message || 'HTTP 请求超时'
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
    userMore() {
      alert(JSON.stringify(this.user, null, 2))
    },
    getBookmarks() {
      if (userData.value?.id !== this.$route.params.id) return
      axios
        .get(`${API_BASE}/ajax/user/${userData.value.id}/illusts/bookmarks`, {
          params: {
            tag: '',
            offset: 0,
            limit: 48,
            rest: 'show',
          },
        })
        .then(({ data }) => {
          this.bookmarks = data.works
        })
    },
  },
  beforeRouteUpdate(to, from) {
    this.init(to.params.id)
  },
  mounted() {
    document.title = `User | PixivNow`
    this.init(this.$route.params.id)
  },
}
</script>

<style scoped lang="sass">
.loading
  text-align: center

.userInfo
  position: relative
  margin: -1rem -1rem 1rem -1rem
  // box-shadow: 0 4px 16px var(--theme-box-shadow-color)

  .bgArea
    .bgContainer
      position: relative
      width: 100%
      height: 45vh
      background-color: #efefef
      background-position: center top
      background-repeat: no-repeat
      background-size: 100%
      background-attachment: fixed

      @media screen and(max-width: 800px)
        &
          background-size: auto 55vh

      > span
        user-select: none
        color: #ccc
        display: inline-block
        position: absolute
        left: 50%
        top: 50%
        transform: translateX(-50%) translateY(-50%)

  .infoArea
    padding-left: calc(2rem + 100px + 2rem)
    padding-top: 1rem
    padding-right: 1rem

    > div
      margin: 0.4rem auto

      [data-icon]
        width: 1rem
        margin-right: .4rem

    .username
      font-size: 1.4rem
      font-weight: 600

  .avatarArea
    position: absolute
    top: calc(45vh - 50px)
    left: 2rem
    // left: 50%
    // transform: translateX(-50%)

    img
      box-sizing: border-box
      width: 100px
      height: 100px
      border-radius: 50%
      border: 4px solid #fff
      box-shadow: 0 4px 8px #efefef

.tabber
  ul.tabBtn
    list-style: none
    padding-left: 0
    margin: 0

    li
      display: inline-block
      margin: 1px 0

      a
        padding: 0.4rem 1rem
        cursor: pointer

        &.tabActive
          font-weight: bold

  .tabContents
    border-top: 1px solid var(--theme-link-color)
</style>
