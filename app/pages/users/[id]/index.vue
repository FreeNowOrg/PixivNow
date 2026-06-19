<template lang="pug">
#user-view
  //- Loading
  section.loading(v-if='loadingUser')
    .bg-area.no-background
      .bg-container(style='background-color: #efefef')
    .user-info
      .info-area
        .avatar-area
          FnbSkeleton(circle height='6rem' width='6rem')
        .username-header.flex
          h1.username: FnbSkeleton(text width='8em')
        .desc(v-for='_ in 5')
          FnbSkeleton(circle height='1em' text width='1em')
          FnbSkeleton(
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
            FnbButton(
              :loading='loadingUserFollow',
              :variant='user.isFollowed ? "success" : "default"'
              @click='handleUserFollow'
              size='sm'
            )
              template(#icon)
                IFasCheck(v-if='user.isFollowed')
                IFasPlus(v-else)
              | {{ user.isFollowed ? '已关注' : '关注' }}
          .user-folow(v-else)
            FnbButton(size='sm') 我真棒
        .following
          RouterLink(:to='`/users/${user.userId}/following`') 关注了 <strong>{{ user.following }}</strong> 人
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

    Teleport(to='body')
      Transition(name='dialog')
        .fnb-dialog-overlay(v-if='showUserMore' @click.self='showUserMore = false')
          .fnb-dialog-card
            button.fnb-dialog-card__close(@click='showUserMore = false' aria-label='关闭') ×
            .fnb-dialog-card__header 用户资料
            .fnb-dialog-card__body
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
                    FnbImage(
                      :preview-src='user.workspace.wsBigUrl',
                      :src='user.workspace.wsUrl'
                      lazy
                      v-if='user.workspace.wsUrl'
                    )
                    FnbTable
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
      FnbTabs(
        v-model='tab'
        :tabs='tabsList'
      )
        template(#panel-illusts)
          .fnb-empty(v-if='user.illusts && !user.illusts.length') 用户没有插画作品 (｡•́︿•̀｡)
          .user-illust.body-inner(v-else)
            ArtworkListByUser(:user-id='user.userId' work-category='illust')
        template(#panel-mangas)
          .fnb-empty(v-if='!user.manga?.length') 用户没有漫画作品 (*/ω＼*)
          .user-manga.body-inner(v-else)
            ArtworkListByUser(:user-id='user.userId' work-category='manga')
        template(#panel-public_bookmarks)
          ArtworkList(
            :list='[]',
            :loading='8'
            v-if='!publicBookmarks?.length && loadingPublicBookmarks'
          )
          .fnb-empty(v-else-if='!publicBookmarks?.length') {{ emptyPublicBookmarksText }}
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
        template(#panel-hidden_bookmarks v-if='isSelfUserPage')
          ArtworkList(
            :list='[]',
            :loading='8'
            v-if='!hiddenBookmarks?.length && loadingHiddenBookmarks'
          )
          .fnb-empty(v-else-if='!hiddenBookmarks?.length') 没有隐藏的小秘密 இ௰இ
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
definePageMeta({
  name: 'users',
  alias: ['/u/:id'],
})
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import ArtworkListByUser from '~/components/Artwork/ArtworkListByUser.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import ShowMore from '~/components/ShowMore.vue'
import IFasBirthdayCake from '~icons/fa-solid/birthday-cake'
import IFasCheck from '~icons/fa-solid/check'
import IFasHome from '~icons/fa-solid/home'
import IFasMapMarkerAlt from '~icons/fa-solid/map-marker-alt'
import IFasParking from '~icons/fa-solid/parking'
import IFasPlus from '~icons/fa-solid/plus'
import IFasVenusMars from '~icons/fa-solid/venus-mars'
import { useUserStore } from '~/stores/session'
import { useUserProfileStore } from '~/stores/user-profile'
import type { ArtworkInfo, User } from '~/types'
import { setTitle } from '~/utils/setTitle'
import { effect } from 'vue'

const loadingUser = ref(true)
const user = ref<User>()
const userStore = useUserStore()
const userProfileStore = useUserProfileStore()
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

const tab = ref<string>()
const error = ref('')
const showUserMore = ref(false)
useBodyScrollLock(showUserMore)
const route = useRoute()
const router = useRouter()

const emptyPublicBookmarksText = computed(() =>
  isSelfUserPage.value
    ? '收藏夹是空的 Σ(⊙▽⊙"a'
    : user.value?.name + '没有公开的收藏 (❁´◡`❁)'
)

const tabsList = computed(() => {
  const list = [
    { key: UserTabs.illusts, label: '插画' },
    { key: UserTabs.mangas, label: '漫画' },
    { key: UserTabs.public_bookmarks, label: '公开收藏' },
  ]
  if (isSelfUserPage.value) {
    list.push({ key: UserTabs.hidden_bookmarks, label: '秘密收藏' })
  }
  return list
})

const workspaceNameMap: Record<string, string> = {
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

  try {
    loadingUser.value = true
    user.value = await userProfileStore.fetchUser('' + id)
    tab.value = initTab || UserTabs.illusts
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
async function handleUserFollow() {
  const target = user.value
  if (!target) return

  loadingUserFollow.value = true
  try {
    if (target.isFollowed) {
      await userProfileStore.unfollowUser(target.userId)
    } else {
      await userProfileStore.followUser(target.userId)
    }
    target.isFollowed = !target.isFollowed
  } finally {
    loadingUserFollow.value = false
  }
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
    const data = await userProfileStore.fetchBookmarks(curUser.userId, {
      offset: curList.value.length,
      hidden: !!hidden,
    })
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

<style scoped lang="scss">
.user-info {
  position: relative;

  .bg-area {
    position: fixed;
    left: 0;
    top: 63px;
    height: 40vh;
    width: 100%;
    z-index: 1;
    @media (max-width: 800px) {
      height: 20vh;
    }
    .bg-container {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: #efefef;
      background-position: center;
      background-repeat: no-repeat;
      background-size: cover;

      > span {
        user-select: none;
        color: #ccc;
        display: inline-block;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
      }
    }
  }

  .info-area {
    position: relative;
    background-color: #fff;
    box-shadow: 0 0 0.5rem #aaa;
    padding-left: calc(2rem + 100px + 2rem);
    padding-top: 1rem;
    padding-right: 1rem;
    padding-bottom: 3rem;
    margin-top: 40vh;
    z-index: 2;
    > div {
      margin: 0.4rem auto;
      [data-icon] {
        width: 1rem;
        margin-right: 0.4rem;
      }
    }
    @media (max-width: 800px) {
      margin-top: 20vh;
      padding-left: 1rem;
      padding-top: 60px;
    }
  }

  .avatar-area {
    position: absolute;
    top: -50px;
    left: 2rem;
    @media (max-width: 800px) {
      left: 50%;
      transform: translateX(-50%);
    }
    img {
      box-sizing: border-box;
      width: 100px;
      height: 100px;
      @include fnb-border-sm;
      background-color: #fff;
      border: 4px solid #fff;
      box-shadow: 0 0.2rem 0.4rem #cdcdcd;
    }
  }

  .username {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0;
  }

  .comment {
    max-height: 4rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .userMore {
    white-space: nowrap;
  }
}

#user-artworks {
  position: relative;
  background-color: #fff;
  z-index: 2;

  .fnb-tabs__nav {
    background-color: var(--fnb-bg);
    z-index: 12;
    position: sticky;
    top: 63px;
  }
}

.user-illust,
.user-manga {
  :deep(.author) {
    display: none;
  }
}

.fnb-empty {
  margin: 20vh auto;
  text-align: center;
  color: var(--fnb-text-muted);
}

.info-modal {
  position: relative;
  hr {
    margin: 1.5rem auto;
    width: 75%;
    border: none;
    height: 2px;
    background-color: #dedede;
  }
  .top {
    text-align: center;
    background-color: #f4f4f4;
    z-index: 1;
    padding: 1rem 0;
    margin: 0 -1.5rem;
    .avatar {
      width: 80px;
      margin: 0 auto;
      img {
        border-radius: 50%;
        width: 80px;
      }
      .premium-icon {
        position: absolute;
        bottom: 0;
        right: 0;
        color: #ffa500;
        cursor: help;
      }
    }
    .title {
      font-size: 1rem;
      font-weight: 600;
    }
  }

  .user-workspace {
    :deep(img) {
      width: 100%;
    }
  }
}

</style>

<style lang="scss">
// These styles apply to Teleport'd dialog content (escapes scoped styles)
.fnb-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.fnb-dialog-card {
  @include fnb-border;
  @include fnb-shadow-lg;
  background: var(--fnb-surface);
  width: 600px;
  max-width: 86vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;

  &__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
    color: var(--fnb-text-muted);
    z-index: 1;

    &:hover {
      color: var(--fnb-text);
    }
  }

  &__header {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.1rem;
    padding: 1rem 1.5rem 0.5rem;
    padding-right: 2.5rem;
  }

  &__body {
    padding: 0 1.5rem 1rem;
    overflow-y: auto;
    flex: 1;
  }
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
