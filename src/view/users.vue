<template lang="pug">
#user-view
  //- Loading
  section.loading(v-if='loading')
    .bg-area.no-background
      .bg-container(style='background-color: #efefef')
    .user-info
      .info-area
        .avatar-area
          NSkeleton(circle height='6rem' width='6rem')
        .username-header.flex
          h1.username: NSkeleton(text width='8em')
        .desc(v-for='_ in 5')
          NSkeleton(circle height='1em' text width='1em')
          NSkeleton(
            :width='`${Math.max(4, 12 * Math.random())}em`'
            style='margin-left: 0.5em'
            text
          )
    #user-artworks.body-inner
      ArtworkList(:list='[]', :loading='20')

  //- Error
  section.error(v-if='error')
    ErrorPage(:description='error' title='出大问题')

  //- :)
  section.user(v-if='!loading && !error && user')
    .user-info
      .bg-area(:class='{ "no-background": !user?.background }')
        .bg-container(
          :style='{ backgroundImage: user?.background?.url ? `url("${user.background.url}")` : undefined }'
        )
          span(v-if='!user?.background') 用户未设置封面~
      .info-area
        .avatar-area
          a.plain.pointer(@click='showUserMore = true')
            img(:src='user.imageBig')
        .username-header.flex
          h1.username {{ user.name }}
          .flex-1
          .user-folow(v-if='user.userId !== userStore.userId')
            NButton(
              :loading='loadingUserFollow',
              :type='user.isFollowed ? "success" : undefined'
              @click='handleUserFollow'
            )
              template(#icon)
                i-fa-solid-check(v-if='user.isFollowed')
                i-fa-solid-plus(v-else)
              | {{ user.isFollowed ? '已关注' : '关注' }}
        .following
          | 关注了 <strong>{{ user.following }}</strong> 人
        .gender(v-if='user.gender?.name')
          i-fa-solid-venus-mars(data-icon)
          | {{ user.gender.name }}
        .birthday(v-if='user.birthDay?.name')
          i-fa-solid-birthday-cake(data-icon)
          | {{ user.birthDay?.name }}
        .region(v-if='user.region?.name')
          i-fa-solid-map-marker-alt(data-icon)
          | {{ user.region?.name }}
        .webpage(v-if='user.webpage')
          i-fa-solid-home(data-icon)
          a(:href='user.webpage' rel='noopener noreferrer' target='_blank') {{ user.webpage }}
        .flex
          .comment.flex-1 {{ user.comment }}
          .user-more
            a(@click='userMore' href='javascript:;') 查看更多

    NModal(closable preset='card' v-model:show='showUserMore')
      .info-modal
        .top
          h3
            a.avatar(:href='user.imageBig' target='_blank' title='查看头像')
              img(:src='user.imageBig')
              .premium-icon(title='该用户订阅了高级会员' v-if='user.premium')
                i-fa-solid-parking(data-icon)
            .title {{ user.name }}
        .bottom
          section.user-comment
            h4 个人简介
            .comment.pre {{ user.comment || '-' }}
          section.user-workspace(v-if='user.workspace')
            hr
            h4 工作环境
            NImage(
              :preview-src='user.workspace.wsBigUrl',
              :src='user.workspace.wsUrl'
              lazy
              v-if='user.workspace.wsUrl'
            )
            NTable
              tbody
                tr(v-for='(val, key) in user.workspace')
                  th {{ workspaceNameMap[key] || key }}
                  td {{ val }}
          section.dev-only
            hr
            h4 Debug Info
            details
              pre(style='overflow: auto; background: #efefef; padding: 4px') {{ JSON.stringify(user, null, 2) }}

    #user-artworks
      .tabber
        ul.tab-btn
          li(@click='tab = "illust"')
            a(:class='{ "tab-active": tab === "illust" }') 插画
          li(@click='tab = "manga"')
            a(:class='{ "tab-active": tab === "manga" }') 漫画
          li(@click='tab = "bookmarks"')
            a(:class='{ "tab-active": tab === "bookmarks" }') {{ user.userId === userStore.userId ? '我' : user.name }}的收藏
        .tab-contents
          section(v-if='tab === "illust"')
            h2 插画
            .no-result(v-if='user.illusts && !user.illusts.length')
              div 用户没有插画作品 (｡•́︿•̀｡)
            ArtworkList(:list='user.illusts', :show-tags='false')
          section(v-if='tab === "manga"')
            h2 漫画
            .no-result(v-if='user.manga && !user.manga.length')
              div 用户没有漫画作品 (*/ω＼*)
            ArtworkList(:list='user.manga', :show-tags='false')
          section(v-if='tab === "bookmarks"')
            h2 {{ user.userId === userStore.userId ? '我' : user.name }}的收藏
            .no-result(v-if='!loadingBookmarks && !bookmarks.length')
              div {{  user.userId === userStore.userId ? '收藏夹是空的 Σ(⊙▽⊙"a' : `${user.name}没有公开的收藏 ${'(❁´◡`❁)'}`  }}
            ArtworkList(:list='bookmarks', :show-tags='false')
            .more-btn.align-center(v-if='bookmarks.length')
              ShowMore(
                :loading='loadingBookmarks',
                :method='getBookmarks',
                :text='loadingBookmarks ? "正在加载" : "加载更多"'
              )
</template>

<script lang="ts" setup>
import { addUserFollow, removeUserFollow } from '@/utils/userActions'
import { ajax } from '@/utils/ajax'

import ArtworkList from '@/components/ArtworksList/ArtworkList.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Placeholder from '@/components/Placeholder.vue'
import ShowMore from '@/components/ShowMore.vue'

import { getCache, setCache } from './siteCache'
import { sortArtList } from '@/utils/artworkActions'
import { useUserStore } from '@/plugins/states'
import type { ArtworkInfo, User } from '@/types'
import { NButton, NImage, NModal, NSkeleton, NTable } from 'naive-ui'

const loading = ref(true)
const user = ref<User>()
const bookmarks = ref<ArtworkInfo[]>([])
const loadingBookmarks = ref(false)
const tab = ref<'illust' | 'manga' | 'bookmarks'>('illust')
const error = ref('')
const showUserMore = ref(false)
const route = useRoute()
const userStore = useUserStore()

const workspaceNameMap = {
  userWorkspacePc: '个人电脑',
  userWorkspaceMonitor: '显示器',
  userWorkspaceTool: '创作工具',
  userWorkspaceScanner: '扫描仪',
  userWorkspaceTablet: '平板电脑',
  userWorkspaceMouse: '鼠标',
  userWorkspacePrinter: '打印机',
  userWorkspaceDesktop: '桌面',
  userWorkspaceMusic: '音乐播放器',
  userWorkspaceDesk: '桌子',
  userWorkspaceChair: '椅子',
  userWorkspaceComment: '说明',
  wsUrl: '工作空间图片URL',
  wsBigUrl: '工作空间大图片URL',
}

async function init(id: string | number): Promise<void> {
  // reset states
  user.value = undefined
  tab.value = 'illust'
  error.value = ''
  bookmarks.value = []

  const cache = getCache(`users.${id}`)
  if (cache) {
    loading.value = false
    user.value = cache
    document.title = `${cache.name} | User | PixivNow`
    // Extra
    await getBookmarks()
    return
  }
  try {
    loading.value = true
    const [{ data }, { data: profileData }] = await Promise.all([
      ajax.get<User>(`/ajax/user/${id}?full=1`),
      ajax.get<{
        illusts: Record<string, ArtworkInfo>
        manga: Record<string, ArtworkInfo>
        novels: Record<string, ArtworkInfo>
      }>(`/ajax/user/${id}/profile/top`),
    ])
    const userValue = {
      ...data,
      illusts: sortArtList(profileData.illusts),
      manga: sortArtList(profileData.manga),
      novels: sortArtList(profileData.novels),
    }
    user.value = userValue
    setCache(`users.${id}`, userValue)
    document.title = `${data.name} | User | PixivNow`
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '未知错误'
    }
  } finally {
    loading.value = false
    getBookmarks()
  }
}

const loadingUserFollow = ref(false)
function handleUserFollow() {
  const target = user.value
  if (!target) return

  loadingUserFollow.value = true
  const isFollowed = target.isFollowed
  const handler = isFollowed ? removeUserFollow : addUserFollow
  handler(target.userId)
    .then(() => {
      target.isFollowed = !isFollowed
    })
    .finally(() => {
      loadingUserFollow.value = false
    })
}

function userMore(): void {
  showUserMore.value = true
}

async function getBookmarks(): Promise<void> {
  const target = user.value
  if (!target) return
  if (loadingBookmarks.value) return

  try {
    loadingBookmarks.value = true
    const { data } = await ajax.get<{ works: ArtworkInfo }>(
      `/ajax/user/${target.userId}/illusts/bookmarks`,
      {
        params: new URLSearchParams({
          tag: '',
          offset: `${bookmarks.value.length}`,
          limit: '48',
          rest: 'show',
        }),
      }
    )
    bookmarks.value = bookmarks.value.concat(data.works)
  } catch (err) {
    console.warn('failed to fetch bookmarks', err)
  } finally {
    loadingBookmarks.value = false
  }
}

onBeforeRouteUpdate((to) => {
  if (to.name !== 'users') {
    return
  }
  init(to.params.id as string)
})

onMounted(async () => {
  document.title = `User | PixivNow`
  init(route.params.id as string)
})
</script>

<style scoped lang="sass">
.user-info
  position: relative
  // margin: -1rem -1rem 1rem -1rem
  // box-shadow: 0 4px 16px var(--theme-box-shadow-color)

  .bg-area
    position: fixed
    left: 0
    top: 50px
    height: 40vh
    width: 100%
    z-index: 1
    @media (max-width: 800px)
      height: 20vh
    .bg-container
      position: relative
      width: 100%
      height: 100%
      background-color: #efefef
      background-position: center
      background-repeat: no-repeat
      background-size: cover

      > span
        user-select: none
        color: #ccc
        display: inline-block
        position: absolute
        left: 50%
        top: 50%
        transform: translateX(-50%) translateY(-50%)

  .info-area
    position: relative
    background-color: #fff
    box-shadow: 0 0 0.5rem #aaa
    padding-left: calc(2rem + 100px + 2rem)
    padding-top: 1rem
    padding-right: 1rem
    padding-bottom: 3rem
    margin-top: 40vh
    z-index: 2
    > div
      margin: 0.4rem auto
      [data-icon]
        width: 1rem
        margin-right: .4rem
    @media (max-width: 800px)
      margin-top: 20vh
      padding-left: 1rem
      padding-top: 60px
  .avatar-area
    position: absolute
    top: -50px
    left: 2rem
    @media (max-width: 800px)
      left: 50%
      transform: translateX(-50%)
    img
      box-sizing: border-box
      width: 100px
      height: 100px
      border-radius: 50%
      border: 4px solid #fff
      box-shadow: 0 4px 8px #efefef
  .username
    font-size: 1.6rem
    font-weight: 700
    margin: 0
  .comment
    max-height: 4rem
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis
  .userMore
    white-space: nowrap

#user-artworks
  position: relative
  background-color: #fff
  z-index: 2

.tabber
  ul.tab-btn
    list-style: none
    padding-left: 0
    margin: 0
    background-color: var(--theme-background-color)
    box-shadow: 0 6px 10px -6px #ccc
    transition: all 0.4s ease-in-out
    z-index: 12
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
    // margin: -3.5rem -2rem 0 -2rem
    // padding: 2rem
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

  .user-workspace
    :deep(img)
      width: 100%

  .bottom
    margin: 1.5rem 5%
</style>
