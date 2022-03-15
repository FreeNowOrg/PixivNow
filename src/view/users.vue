<template lang="pug">
#user-view
  //- Loading
  section.loading(v-if='loading')
    placeholder
    p {{ loading ? "正在读取用户 #" + $route.params.id : "“" + user.name + "”的空间" }}

  //- Error
  section.error(v-if='error')
    error-page(title='出大问题', :description='error')

  //- :)
  section.user(v-if='!loading && !error')
    .user-info
      .bg-area
        .bg-container(
          :style='{ backgroundImage: "url(" + API_BASE + user?.background?.url + ")" }'
        )
          span(v-if='!user.background') 用户未设置封面~
      .avatar-area
        a.plain.pointer(@click='showUserMore = true')
          img(:src='API_BASE + user.imageBig')
      .info-area
        .username {{ user.name }}
        .following
          | 关注了 <strong>{{ user.following }}</strong> 人
        .gender(v-if='user.gender?.name') 
          fa(icon='venus-mars')
          | {{ user.gender.name }}
        .birthday(v-if='user.birthDay?.name')
          fa(icon='birthday-cake')
          | {{ user.birthDay?.name }}
        .region(v-if='user.region?.name')
          fa(icon='map-marker-alt')
          | {{ user.region?.name }}
        .webpage(v-if='user.webpage')
          fa(icon='home')
          a(:href='user.webpage', target='_blank', rel='noopener noreferrer') {{ user.webpage }}
        .flex
          .comment.flex-1 {{ user.comment }}
          .user-more
            a(@click='userMore', href='javascript:;') 查看更多

    modal.info-modal(v-model:show='showUserMore')
      .top
        h3
          a.avatar(
            :href='API_BASE + user.imageBig',
            title='查看头像',
            target='_blank'
          )
            img(:src='API_BASE + user.imageBig')
            .premium-icon(v-if='user.premium', title='该用户订阅了高级会员')
              fa(icon='parking')
          .title {{ user.name }}
          .follow
            button 关注

      .bottom
        section.user-comment
          h4 个人简介
          .comment.pre {{ user.comment || "-" }}
        section.user-workspace(v-if='user.workspace')
          hr
          h4 工作环境
          .flex-list
            .list-item(v-if='user.workspace.wsUrl')
              img(
                :src='user.workspace.wsUrl',
                style='width: 100%; height: auto',
                alt='工作环境照片'
                lazyload
              )
            .list-item(v-if='user.workspace.userWorkspacePc')
              .key 主机
              .value {{ user.workspace.userWorkspacePc }}
            .list-item(v-if='user.workspace.userWorkspaceMonitor')
              .key 显示器
              .value {{ user.workspace.userWorkspaceMonitor }}
            .list-item(v-if='user.workspace.userWorkspaceTool')
              .key 软件
              .value {{ user.workspace.userWorkspaceTool }}
            .list-item(v-if='user.workspace.userWorkspaceScanner')
              .key 扫描仪
              .value {{ user.workspace.userWorkspaceScanner }}
            .list-item(v-if='user.workspace.userWorkspaceTablet')
              .key 数码版
              .value {{ user.workspace.userWorkspaceTablet }}
            .list-item(v-if='user.workspace.userWorkspacePrinter')
              .key 打印机
              .value {{ user.workspace.userWorkspacePrinter }}
            .list-item(v-if='user.workspace.userWorkspaceDesktop')
              .key 台面
              .value {{ user.workspace.userWorkspaceDesktop }}
            .list-item(v-if='user.workspace.userWorkspaceMusic')
              .key 音乐
              .value {{ user.workspace.userWorkspaceMusic }}
            .list-item(v-if='user.workspace.userWorkspaceDesk')
              .key 桌子
              .value {{ user.workspace.userWorkspaceDesk }}
            .list-item(v-if='user.workspace.userWorkspaceChair')
              .key 椅子
              .value {{ user.workspace.userWorkspaceChair }}
            .list-item(v-if='user.workspace.userWorkspaceComment')
              .key 说明
              .value {{ user.workspace.userWorkspaceComment }}
        section.dev-only
          hr
          h4 Debug Info
          details
            pre(style='overflow: auto; background: #efefef; padding: 4px') {{ JSON.stringify(user, null, 2) }}

    .dev-only
      h2 Follow Test
      .align-center
        button(@click='async () => await addFollow(+user.userId)') addFollow
        button(@click='async () => await removeFollow(+user.userId)') removeFollow

    #user-artworks
      .tabber
        ul.tab-btn
          li(@click='tab = "illust"')
            a(:class='{ "tab-active": tab === "illust" }') 插画
          li(@click='tab = "manga"')
            a(:class='{ "tab-active": tab === "manga" }') 漫画
          li(
            v-if='$route.params.id === userData?.id',
            @click='tab = "bookmarks"'
          )
            a(:class='{ "tab-active": tab === "bookmarks" }') 收藏
        .tab-contents
          section(v-if='tab === "illust"')
            h2 插画
            .no-result(v-if='user.illusts && !user.illusts.length') 
              div 用户没有插画作品 (｡•́︿•̀｡)
            artworks-list(:list='user.illusts')
          section(v-if='tab === "manga"')
            h2 漫画
            .no-result(v-if='user.manga && !user.manga.length')
              div 用户没有漫画作品 (*/ω＼*)
            artworks-list(:list='user.manga')
          section(v-if='tab === "bookmarks"')
            h2 收藏
            .no-result(v-if='!loadingBookmarks && !bookmarks.length')
              div 收藏夹是空的 Σ(⊙▽⊙"a
            artworks-list(:list='bookmarks')
            .more-btn.align-center
              a.button(@click='getBookmarks')
                fa(
                  :icon='loadingBookmarks ? "spinner" : "arrow-down"',
                  :spin='loadingBookmarks'
                )
                | {{ loadingBookmarks ? "正在加载……" : "加载更多" }}
</template>

<script lang="ts" setup>
import axios from 'axios'
import { API_BASE } from '../config'
import { userData } from '../components/userData'
import { addFollow, removeFollow } from '../utils/userActions'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Modal from '../components/Modal.vue'
import Placeholder from '../components/Placeholder.vue'

import { getCache, setCache } from './siteCache'
import { ArtworkReduced, User } from '../types'
import { onMounted, ref } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const loading = ref(true)
const user = ref<User>({} as User)
const bookmarks = ref<ArtworkReduced[]>([])
const loadingBookmarks = ref(false)
const tab = ref<'illust' | 'manga' | 'bookmarks'>('illust')
const error = ref('')
const showUserMore = ref(false)
const route = useRoute()

function init(id: string | number): void {
  const cache = getCache(`users.${id}`)
  if (cache) {
    loading.value = false
    user.value = cache
    document.title = `${cache.name} | User | PixivNow`
    // Extra
    getBookmarks()
    return
  }

  axios.get(`${API_BASE}/api/user/${id}`)
    .then(
      ({ data }: { data: User }) => {
        user.value = data
        setCache(`users.${id}`, data)
        document.title = `${data.name} | User | PixivNow`

        getBookmarks()
      })
    .catch(
      (err) => {
        console.warn('user', err.response)
        error.value =
          err?.response?.data?.message || err.message || 'HTTP 请求超时'
      }
    )
    .finally(() => loading.value = false)
}

function userMore(): void {
  showUserMore.value = true
}

function getBookmarks(): void {
  if (userData.value?.id !== route.params.id) return
  if (loadingBookmarks.value) return
  loadingBookmarks.value = true

  axios
    .get(`${API_BASE}/ajax/user/${userData.value.id}/illusts/bookmarks`, {
      params: {
        offset: bookmarks.value.length ?? 0,
        tag: '',
        limits: 48,
        rest: 'show',
      },
    })
    .then(({ data }: { data: { works: ArtworkReduced[] } }) => {
      bookmarks.value = bookmarks.value.concat(data.works)
    })
    .finally(() => loadingBookmarks.value = false)
}

onBeforeRouteUpdate((to) => init(to.params.id as string))

onMounted(() => {
  document.title = `User | PixivNow`
  init(route.params.id as string)
})
</script>

<style scoped lang="sass">

.loading
  text-align: center

.user-info
  position: relative
  // margin: -1rem -1rem 1rem -1rem
  // box-shadow: 0 4px 16px var(--theme-box-shadow-color)

  .bg-area
    .bg-container
      position: relative
      width: 100%
      height: 45vh
      background-color: #efefef
      background-position: center
      background-repeat: no-repeat
      background-size: cover
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

  .info-area
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

    .comment
      max-height: 4rem
      overflow: hidden
      white-space: nowrap
      text-overflow: ellipsis

    .userMore
      white-space: nowrap

  .avatar-area
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
  ul.tab-btn
    list-style: none
    padding-left: 0
    margin: 0
    background-color: var(--theme-background-color)
    box-shadow: 0 6px 10px -6px #ccc
    transition: all 0.4s ease-in-out
    z-index: 10
    position: sticky
    top: 50px

    .global-navbar_hidden &
      top: 0

    li
      display: inline-block
      margin: 1px 0

      a
        padding: 0.4rem 1rem
        cursor: pointer

        &.tab-active
          font-weight: bold

  .tab-contents
    border-top: 1px solid var(--theme-link-color)

.no-result
  height: 90vh
  display: flex
  align-items: center

  > div
    text-align: center
    flex: 1

.info-modal
  position: relative

  hr
    margin: 1.5rem auto
    width: 75%
    border: none
    height: 2px
    background-color: #dedede

  .top
    text-align: center
    background-color: #f4f4f4
    z-index: 1
    margin: -3.5rem -2rem 0 -2rem
    padding: 2rem

    .avatar
      width: 80px
      margin: 0 auto

      img
        border-radius: 50%
        width: 80px

      .premium-icon
        position: absolute
        bottom: 0
        right: 0
        color: #ffa500
        cursor: help

    .title
      font-size: 1rem
      font-weight: 600

    .follow
      button
        font-size: 1rem
        background-color: #ddd
        border-radius: 1rem
        color: var(--theme-text-color)
        padding: 0.3rem 1.5rem

  .bottom
    margin: 1.5rem 5%
</style>
