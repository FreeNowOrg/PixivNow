<template lang="pug">
#user-view
  //- Loading
  section.loading(v-if='loadingUser')
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
  section.error(v-else-if='error')
    ErrorPage(:description='error' title='出大问题')

  //- :)
  section.user(v-else-if='user')
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
          .user-folow(v-if='!isSelfUserPage')
            NButton(
              :loading='loadingUserFollow',
              :type='user.isFollowed ? "success" : undefined'
              @click='handleUserFollow'
              round
              size='small'
            )
              template(#icon)
                IFasCheck(v-if='user.isFollowed')
                IFasPlus(v-else)
              | {{ user.isFollowed ? '已关注' : '关注' }}
          .user-folow(v-else)
            NButton(round size='small' type='info')
              | 我真棒
        .following
          RouterLink(:to='{ name: "following", params: { id: user.userId } }') 关注了 <strong>{{ user.following }}</strong> 人
        .gender(v-if='user.gender?.name')
          IFasVenusMars(data-icon)
          | {{ user.gender.name }}
        .birthday(v-if='user.birthDay?.name')
          IFasBirthdayCake(data-icon)
          | {{ user.birthDay?.name }}
        .region(v-if='user.region?.name')
          IFasMapMarkerAlt(data-icon)
          | {{ user.region?.name }}
        .webpage(v-if='user.webpage')
          IFasHome(data-icon)
          a(:href='user.webpage' rel='noopener noreferrer' target='_blank') {{ user.webpage }}
        .flex
          .comment.flex-1 {{ user.comment }}
          .user-more
            a(@click='userMore' href='javascript:;') 查看更多

    NModal(closable preset='card' title='用户资料' v-model:show='showUserMore')
      .info-modal
        .top
          h3
            a.avatar(:href='user.imageBig' target='_blank' title='查看头像')
              img(:src='user.imageBig')
              .premium-icon(title='该用户订阅了高级会员' v-if='user.premium')
                IFasParking(data-icon)
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
      NTabs(
        :bar-width='32'
        justify-content='space-evenly'
        type='line'
        v-model:value='tab'
      )
        NTabPane(display-directive='show:lazy' :name='UserTabs.illusts' tab='插画')
          NEmpty(
            description='用户没有插画作品 (｡•́︿•̀｡)'
            v-if='user.illusts && !user.illusts.length'
          )
          .user-illust.body-inner(v-else)
            ArtworksByUser(:user-id='user.userId' work-category='illust')
        NTabPane(display-directive='show:lazy' :name='UserTabs.mangas' tab='漫画')
          NEmpty(description='用户没有漫画作品 (*/ω＼*)' v-if='!user.manga?.length')
          .user-manga.body-inner(v-else)
            ArtworksByUser(:user-id='user.userId' work-category='manga')
        NTabPane(:name='UserTabs.public_bookmarks' tab='公开收藏')
          ArtworkList(
            :list='[]',
            :loading='8'
            v-if='!publicBookmarks?.length && loadingPublicBookmarks'
          )
          NEmpty(
            :description='isSelfUserPage ? `收藏夹是空的 Σ(⊙▽⊙"a` : `${user.name}没有公开的收藏 ${"(❁´◡`❁)"}`'
            v-else-if='!publicBookmarks?.length'
          )
          .user-bookmarks.body-inner(v-else)
            ArtworkList(:list='publicBookmarks')
            .more-btn.align-center(
              v-if='publicBookmarks.length && hasMorePublicBookmarks'
            )
              ShowMore(
                :loading='loadingPublicBookmarks',
                :method='() => getBookmarks(false)',
                :text='loadingPublicBookmarks ? "正在加载" : "加载更多"'
              )
        NTabPane(:name='UserTabs.hidden_bookmarks' tab='秘密收藏' v-if='isSelfUserPage')
          ArtworkList(
            :list='[]',
            :loading='8'
            v-if='!hiddenBookmarks?.length && loadingHiddenBookmarks'
          )
          NEmpty(
            description='没有隐藏的小秘密 இ௰இ'
            v-else-if='!hiddenBookmarks?.length'
          )
          .user-bookmarks.body-inner(v-else)
            ArtworkList(:list='hiddenBookmarks')
            .more-btn.align-center(
              v-if='hiddenBookmarks.length && hasMoreHiddenBookmarks'
            )
              ShowMore(
                :loading='loadingHiddenBookmarks',
                :method='() => getBookmarks(true)',
                :text='loadingHiddenBookmarks ? "正在加载" : "加载更多"'
              )
</template>

<script lang="ts" setup>
import { addUserFollow, removeUserFollow } from '@/utils/userActions'
import { ajax } from '@/utils/ajax'

import ArtworkList from '@/components/ArtworksList/ArtworkList.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import ShowMore from '@/components/ShowMore.vue'
import IFasBirthdayCake from '~icons/fa-solid/birthday-cake'
import IFasCheck from '~icons/fa-solid/check'
import IFasHome from '~icons/fa-solid/home'
import IFasMapMarkerAlt from '~icons/fa-solid/map-marker-alt'
import IFasParking from '~icons/fa-solid/parking'
import IFasPlus from '~icons/fa-solid/plus'
import IFasVenusMars from '~icons/fa-solid/venus-mars'

import { getCache, setCache } from './siteCache'
import { sortArtList } from '@/utils/artworkActions'
import { useUserStore } from '@/composables/states'
import type { ArtworkInfo, User } from '@/types'
import {
  NButton,
  NEmpty,
  NImage,
  NModal,
  NSkeleton,
  NTabPane,
  NTable,
  NTabs,
} from 'naive-ui'
import { setTitle } from '@/utils/setTitle'
import { effect } from 'vue'

const loadingUser = ref(true)
const user = ref<User>()
const isSelfUserPage = computed(() => user.value?.userId === userStore.userId)

const publicBookmarks = ref<ArtworkInfo[]>([])
const loadingPublicBookmarks = ref(false)
const totalPublicBookmarks = ref(0)
const hasMorePublicBookmarks = computed(
  () =>
    publicBookmarks.value.length &&
    publicBookmarks.value.length < totalPublicBookmarks.value
)

const hiddenBookmarks = ref<ArtworkInfo[]>([])
const loadingHiddenBookmarks = ref(false)
const totalHiddenBookmarks = ref(0)
const hasMoreHiddenBookmarks = computed(
  () =>
    hiddenBookmarks.value.length &&
    hiddenBookmarks.value.length < totalHiddenBookmarks.value
)

enum UserTabs {
  illusts = 'illusts',
  mangas = 'mangas',
  public_bookmarks = 'public_bookmarks',
  hidden_bookmarks = 'hidden_bookmarks'
}
const tab = ref<UserTabs>()
const error = ref('')
const showUserMore = ref(false)
const route = useRoute()
const router = useRouter()
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

async function init(id: string | number, initTab?: UserTabs): Promise<void> {
  // reset states
  user.value = undefined
  tab.value = undefined
  error.value = ''
  publicBookmarks.value = []
  hiddenBookmarks.value = []
  totalPublicBookmarks.value = 0
  totalHiddenBookmarks.value = 0

  const cache = getCache(`users.${id}`)
  if (cache) {
    loadingUser.value = false
    user.value = cache
    tab.value = initTab || UserTabs.illusts
    return
  }
  try {
    loadingUser.value = true
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
    tab.value = initTab || UserTabs.illusts
    setCache(`users.${id}`, userValue)
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '未知错误'
    }
  } finally {
    loadingUser.value = false
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

async function getBookmarks(hidden?: boolean): Promise<void> {
  const curUser = user.value
  if (!curUser) return

  const curLoading = hidden ? loadingHiddenBookmarks : loadingPublicBookmarks
  const curList = hidden ? hiddenBookmarks : publicBookmarks
  const curTotal = hidden ? totalHiddenBookmarks : totalPublicBookmarks

  if (curLoading.value) return

  try {
    curLoading.value = true
    const { data } = await ajax.get<{ works: ArtworkInfo; total: number }>(
      `/ajax/user/${curUser.userId}/illusts/bookmarks`,
      {
        params: new URLSearchParams({
          tag: '',
          offset: `${curList.value.length}`,
          limit: '48',
          rest: hidden ? 'hide' : 'show',
        }),
      }
    )
    curTotal.value = data.total
    curList.value = curList.value.concat(data.works)
  } catch (err) {
    console.warn('failed to fetch bookmarks', err)
  } finally {
    curLoading.value = false
  }
}

watch(tab, (newTab) => {
  if (!newTab) return

  const isPublicBookmarkEmpty = !publicBookmarks.value.length
  const isHiddenBookmarkEmpty = !hiddenBookmarks.value.length

  const url = new URL(location.href)
  url.searchParams.set('tab', newTab)
  history.replaceState(history.state, '', '' + url)

  if (newTab === UserTabs.public_bookmarks && isPublicBookmarkEmpty) {
    getBookmarks(false)
  }
  if (newTab === UserTabs.hidden_bookmarks && isHiddenBookmarkEmpty) {
    getBookmarks(true)
  }
})

onBeforeRouteUpdate((to) => {
  if (to.name !== 'users') {
    return
  }
  init(to.params.id as string, to.query.tab as UserTabs)
})

effect(() => setTitle(user.value?.name, 'Users'))
onMounted(async () => {
  init(route.params.id as string, route.query.tab as UserTabs)
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
      background-color: #fff
      border: 4px solid #fff
      box-shadow: 0 0.2rem 0.4rem #cdcdcd
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

:deep(.n-tabs)
  .n-tabs-nav
    background-color: var(--theme-background-color)
    z-index: 12
    position: sticky
    top: 50px
  .n-tabs-nav-scroll-wrapper
    max-width: 1200px
    margin: 0 auto

.user-illust, .user-manga
  :deep(.author)
    display: none

:deep(.n-empty)
  margin: 20vh auto

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
    padding: 1rem 0
    margin: 0 -1.5rem
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
</style>
