<template lang="pug">
#user-view
  //- Loading
  section.loading(v-if='loadingUser')
    .cover-banner.no-cover
    .body-inner.user-layout
      .user-sidebar
        FnbCard
          .avatar-area
            FnbSkeleton(block, height='6rem', width='6rem')
          .sidebar-info
            FnbSkeleton(text, width='8em', height='1.4em')
            .meta-lines
              .meta-line(v-for='_ in 3')
                FnbSkeleton(text, width='1em', height='1em')
                FnbSkeleton(text, :width='`${Math.max(4, 10 * Math.random())}em`')
      .user-content
        ArtworkList(:list='[]', :loading='20')

  //- Error
  section.error(v-else-if='error')
    ErrorPage(:description='error' title='出大问题')

  //- :)
  section.user(v-else-if='user')
    .cover-banner(:class='{ "no-cover": !user?.background }')
      .cover-image(
        v-if='user?.background?.url',
        :style='{ backgroundImage: `url("${user.background.url}")` }'
      )
      span.cover-placeholder(v-else) 用户未设置封面~

    .body-inner.user-layout
      //- Left: User info card
      .user-sidebar
        FnbCard(shadow='md')
          .avatar-area
            a.plain.pointer(@click='showUserMore = true')
              img.user-avatar(:src='user.imageBig', :alt='user.name')
          h2.username {{ user.name }}
          .user-id(v-if='user.premium')
            FnbTag(color='var(--fnb-highlight)') Premium
          .meta-lines
            .meta-line
              RouterLink(:to='`/users/${user.userId}/following`')
                | 关注了
                strong  {{ user.following }}
                |  人
            .meta-line(v-if='user.gender?.name')
              FnbIcon: IFasVenusMars
              | {{ user.gender.name }}
            .meta-line(v-if='user.birthDay?.name')
              FnbIcon: IFasBirthdayCake
              | {{ user.birthDay?.name }}
            .meta-line(v-if='user.region?.name')
              FnbIcon: IFasMapMarkerAlt
              | {{ user.region?.name }}
            .meta-line(v-if='user.webpage')
              FnbIcon: IFasHome
              a(:href='user.webpage', rel='noopener noreferrer', target='_blank') {{ user.webpage }}
          .user-comment(v-if='user.comment')
            hr
            p.comment-text {{ user.comment }}
          .user-comment(v-else)
            hr
            p.comment-text.muted -
          .sidebar-actions
            a.plain.pointer(@click='showUserMore = true') 查看更多
          hr
          .sidebar-buttons
            template(v-if='!isSelfUserPage')
              FnbButton(
                :loading='loadingUserFollow',
                :variant='user.isFollowed ? "success" : "default"',
                @click='handleUserFollow',
                size='sm'
              )
                template(#icon)
                  FnbIcon
                    IFasCheck(v-if='user.isFollowed')
                    IFasPlus(v-else)
                | {{ user.isFollowed ? '已关注' : '关注' }}
            template(v-else)
              FnbButton(size='sm') 我真棒

      //- Right: Artworks
      .user-content
        FnbTabs(
          v-model='tab',
          :tabs='tabsList'
        )
          template(#panel-illusts)
            .fnb-empty(v-if='user.illusts && !user.illusts.length') 用户没有插画作品 (｡•́︿•̀｡)
            .user-illust(v-else)
              ArtworkListByUser(:user-id='user.userId', work-category='illust')
          template(#panel-mangas)
            .fnb-empty(v-if='!user.manga?.length') 用户没有漫画作品 (*/ω＼*)
            .user-manga(v-else)
              ArtworkListByUser(:user-id='user.userId', work-category='manga')
          template(#panel-novels)
            .fnb-empty(v-if='!user.novels?.length') 用户没有小说作品 (｡•́︿•̀｡)
            .user-novels(v-else)
              NovelList(:list='user.novels')
          template(#panel-public_bookmarks)
            ArtworkList(
              :list='[]',
              :loading='8',
              v-if='!publicBookmarks?.length && loadingPublicBookmarks'
            )
            .fnb-empty(v-else-if='!publicBookmarks?.length') {{ emptyPublicBookmarksText }}
            .user-bookmarks(v-else)
              ArtworkList(:list='publicBookmarks')
              .more-btn.align-center(
                v-if='publicBookmarks.length && hasMorePublicBookmarks'
              )
                ShowMore(
                  :loading='loadingPublicBookmarks',
                  :method='() => getBookmarks(false)',
                  :text='loadingPublicBookmarks ? "正在加载" : "加载更多"'
                )
          template(#panel-hidden_bookmarks, v-if='isSelfUserPage')
            ArtworkList(
              :list='[]',
              :loading='8',
              v-if='!hiddenBookmarks?.length && loadingHiddenBookmarks'
            )
            .fnb-empty(v-else-if='!hiddenBookmarks?.length') 没有隐藏的小秘密 இ௰இ
            .user-bookmarks(v-else)
              ArtworkList(:list='hiddenBookmarks')
              .more-btn.align-center(
                v-if='hiddenBookmarks.length && hasMoreHiddenBookmarks'
              )
                ShowMore(
                  :loading='loadingHiddenBookmarks',
                  :method='() => getBookmarks(true)',
                  :text='loadingHiddenBookmarks ? "正在加载" : "加载更多"'
                )

    //- User detail dialog
    .fnb-dialog-overlay(v-if='showUserMore', @click.self='showUserMore = false')
      .fnb-dialog-card
        button.fnb-dialog-card__close(@click='showUserMore = false', aria-label='关闭') ×
        .fnb-dialog-card__header 用户资料
        .fnb-dialog-card__body
          .info-modal
            .modal-top
              a.modal-avatar(:href='user.imageBig', target='_blank', title='查看头像')
                img(:src='user.imageBig')
                .premium-icon(v-if='user.premium', title='该用户订阅了高级会员')
                  FnbIcon: IFasParking
              .modal-name {{ user.name }}
            section.user-bio
              h4 个人简介
              .comment.pre {{ user.comment || '-' }}
            section.user-workspace(v-if='user.workspace')
              hr
              h4 工作环境
              FnbImage(
                v-if='user.workspace.wsUrl',
                :preview-src='user.workspace.wsBigUrl',
                :src='user.workspace.wsUrl',
                lazy
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
                pre(style='overflow: auto; background: var(--fnb-bg); padding: 4px') {{ JSON.stringify(user, null, 2) }}
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'users',
  alias: ['/u/:id'],
})
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import ArtworkListByUser from '~/components/Artwork/ArtworkListByUser.vue'
import ErrorPage from '~/components/ErrorPage.vue'
import NovelList from '~/components/Novel/NovelList.vue'
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
const toast = useToast()
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
  novels = 'novels',
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
  ]
  if (user.value?.novels?.length) {
    list.push({ key: UserTabs.novels, label: '小说' })
  }
  list.push({ key: UserTabs.public_bookmarks, label: '公开收藏' })
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
  } catch {
    toast.error(target.isFollowed ? '取消关注失败，请重试' : '关注失败，请重试')
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
// ── Cover Banner ──
.cover-banner {
  height: 280px;
  position: relative;
  border-bottom: 3px solid var(--fnb-border);
  overflow: hidden;

  &.no-cover {
    height: 120px;
    background: var(--fnb-bg);
  }

  @media (max-width: 768px) {
    height: 180px;
    &.no-cover {
      height: 80px;
    }
  }
}

.cover-image {
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--fnb-text-muted);
  user-select: none;
}

// ── Two-Column Layout ──
.user-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// ── Left Sidebar ──
.user-sidebar {
  text-align: center;

  .avatar-area {
    margin-bottom: 0.75rem;
  }

  .user-avatar {
    width: 100px;
    height: 100px;
    @include fnb-border;
    @include fnb-shadow-sm;
    background: var(--fnb-surface);
  }

  .username {
    font-family: var(--fnb-font-display);
    font-size: 1.3rem;
    font-weight: 900;
    margin: 0 0 0.25rem;
  }

  .user-id {
    margin-bottom: 0.5rem;
  }

  hr {
    border: none;
    height: 3px;
    background: var(--fnb-border);
    margin: 0.75rem -1rem;
  }

  .meta-lines {
    text-align: left;
    font-size: 0.85rem;
    color: var(--fnb-text);
  }

  .meta-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0;

    .fnb-icon {
      color: var(--fnb-brand);
      font-size: 1.3em;
    }

    a {
      display: inline;
    }
  }

  .user-comment {
    text-align: left;

    .comment-text {
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 6rem;
      overflow: hidden;
      margin: 0;

      &.muted {
        color: var(--fnb-text-muted);
      }
    }
  }

  .sidebar-actions {
    text-align: right;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  .sidebar-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }
}

// ── Right Content ──
.user-content {
  min-width: 0;

  :deep(.fnb-tabs__nav) {
    position: sticky;
    top: 63px;
    z-index: 12;
  }
}

.user-illust,
.user-manga,
.user-novels {
  :deep(.author) {
    display: none;
  }
}

.fnb-empty {
  margin: 10vh auto;
  text-align: center;
  color: var(--fnb-text-muted);
}

// ── Detail Modal ──
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

.info-modal {
  hr {
    border: none;
    height: 3px;
    background: var(--fnb-border);
    margin: 1rem 0;
  }

  .modal-top {
    text-align: center;
    background: var(--fnb-bg);
    border-bottom: 3px solid var(--fnb-border);
    padding: 1.5rem 0;
    margin: 0 -1.5rem;
  }

  .modal-avatar {
    display: inline-block;
    position: relative;

    img {
      width: 80px;
      height: 80px;
      @include fnb-border;
      @include fnb-shadow-sm;
    }

    .premium-icon {
      position: absolute;
      bottom: -4px;
      right: -4px;
      color: var(--fnb-highlight);
      background: var(--fnb-surface);
      border: 2px solid var(--fnb-border);
      width: 1.4rem;
      height: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      cursor: help;
    }
  }

  .modal-name {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1rem;
    margin-top: 0.5rem;
  }

  .user-workspace {
    :deep(img) {
      width: 100%;
    }
  }
}
</style>
