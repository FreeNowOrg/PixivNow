<template lang="pug">
#home-view
  //- ── Hero Section ──
  .hero-section(
    :style='{ "background-image": `url(${randomBgRegularUrl || ""})` }'
  )
    .hero-overlay
    .hero-content
      .site-logo
        img(:src='SiteLogo')
      .description Now, everyone can enjoy Pixiv

      .search-area
        SearchBox.big.search

      .quick-links
        FnbTag(clickable, @click='$router.push("/ranking")')
          FnbIcon: ITablerChartBar
          |  排行榜
        FnbTag(clickable, @click='$router.push("/following/latest")')
          FnbIcon: ITablerUsers
          |  关注
        FnbTag(clickable, @click='scrollToDiscovery')
          FnbIcon: ITablerCompass
          |  探索
        FnbTag(clickable, @click='scrollToDiscovery(); changeDiscoveryTab("novel")')
          FnbIcon: ITablerBook
          |  小说

    .bg-info
      a.pointer(@click='homeStore.fetchRandomBg()', title='换一个~')
        FnbIcon: IFasRandom
      a.pointer(
        @click='isShowBgInfo = true',
        style='margin-left: 0.5em',
        title='关于背景',
        v-if='randomBg?.id'
      )
        FnbIcon: IFasInfoCircle

  //- ── Background Info Dialog ──
  .fnb-dialog-overlay(v-if='isShowBgInfo', @click.self='isShowBgInfo = false')
    .fnb-dialog-card
      button.fnb-dialog-card__close(@click='isShowBgInfo = false', aria-label='关闭') ×
      .fnb-dialog-card__header {{ `背景图片：${randomBg?.alt}` }}
      .fnb-dialog-card__body
        .bg-info-modal
          .align-center
            RouterLink.thumb(:to='"/artworks/" + randomBg?.id')
              img(
                :src='randomBgRegularUrl',
                lazyload
              )
            .desc
              .author
                RouterLink(:to='"/users/" + randomBg?.userId') @{{ randomBg?.userName }}
                | 的作品 (ID: {{ randomBg?.id }})
            .tag-list(style='display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 1rem')
              FnbTag(
                :key='tag',
                clickable,
                @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)',
                v-for='tag in randomBg?.tags'
              ) {{ tag }}

  //- ── Body Content ──
  .body-inner
    //- User Status Card
    UserStatusCard

    //- Two-Column Content Area
    .content-grid
      .content-left
        h3.section-title
          FnbIcon: ITablerTrophy
          |  今日排行
        RankingCarousel(
          v-if='homeStore.rankingList.length',
          :artworks='homeStore.rankingList'
        )
        .ranking-skeleton(v-else-if='homeStore.loadingRanking')
          FnbSkeleton(block, height='360px')

      .content-right
        FollowingLatest(
          :artworks='homeStore.followingList',
          :loading='homeStore.loadingFollowing',
          :logged-in='userStore.isLoggedIn'
        )

    //- Discovery Section
    section.discover(ref='discoverRef')
      .discover-header
        h2
          FnbIcon: ITablerCompass
          |  探索发现
        .discover-controls
          DiscoveryTabs(
            :model-value='discoveryTab',
            @update:model-value='changeDiscoveryTab'
          )
          FnbSelect(
            v-if='userStore.isLoggedIn',
            :model-value='discoveryMode',
            :options='discoveryModeOptions',
            @update:model-value='changeDiscoveryMode'
          )
          FnbButton(
            :loading='isDiscoveryLoading',
            @click='refreshDiscovery',
            size='sm'
          )
            template(#icon): IFasRandom
            | {{ isDiscoveryLoading ? '加载中' : '换一批' }}
      ArtworkList(
        v-if='discoveryTab !== "novel"',
        :list='discoveryStore.discoveryList',
        :loading='discoveryStore.loadingDiscovery'
      )
      NovelList(
        v-else,
        :list='discoveryStore.novelDiscoveryList',
        :loading='discoveryStore.loadingNovelDiscovery'
      )

      //- Infinite scroll sentinel / login prompt
      .discover-footer(v-if='!discoveryStore.loadingDiscovery')
        .loading-more(v-if='userStore.isLoggedIn && (discoveryTab === "novel" ? discoveryStore.loadingMoreNovelDiscovery : discoveryStore.loadingMoreDiscovery)')
          FnbSkeleton(block, height='2rem', width='200px')
        .login-prompt(v-else-if='!userStore.isLoggedIn && discoveryStore.discoveryList.length')
          p 登录后解锁无限浏览
          FnbButton(
            size='sm',
            variant='primary',
            tag='RouterLink',
            to='/login?back=/'
          )
            template(#icon): ITablerLogin
            | 登录
        div(v-else-if='userStore.isLoggedIn', ref='scrollSentinel')
</template>

<script lang="ts" setup>
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import NovelList from '~/components/Novel/NovelList.vue'
import SearchBox from '~/components/SearchBox.vue'
import RankingCarousel from '~/components/RankingCarousel.vue'
import UserStatusCard from '~/components/UserStatusCard.vue'
import FollowingLatest from '~/components/FollowingLatest.vue'
import DiscoveryTabs from '~/components/DiscoveryTabs.vue'
import IFasRandom from '~icons/fa-solid/random'
import IFasInfoCircle from '~icons/fa-solid/info-circle'
import { IconChartBar as ITablerChartBar, IconUsers as ITablerUsers, IconCompass as ITablerCompass, IconBook as ITablerBook, IconTrophy as ITablerTrophy, IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useHomeStore } from '~/stores/home'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'
import { toRegularUrl } from '~/utils/pximg'
import SiteLogo from '~/assets/PixivNow.svg'
import { setTitle } from '~/utils/setTitle'

definePageMeta({ name: 'home' })

useHead({
  bodyAttrs: { 'data-route': 'home' },
})

const isShowBgInfo = ref(false)
useBodyScrollLock(isShowBgInfo)
const homeStore = useHomeStore()
const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const discoverRef = ref<HTMLElement | null>(null)
const scrollSentinel = ref<HTMLElement | null>(null)

const randomBg = computed(() => homeStore.randomBg)
const randomBgRegularUrl = computed(() => {
  const bg = randomBg.value
  if (!bg?.url) return ''
  return toRegularUrl(bg.url)
})

const discoveryModeOptions = [
  { label: '混池', value: 'all' },
  { label: '全年龄', value: 'safe' },
  { label: 'R18', value: 'r18' },
]

const savedDiscoveryTab = useLocalStorage('pixivnow:discovery-tab', 'all')
const savedDiscoveryMode = useLocalStorage('pixivnow:discovery-mode', 'all')

const discoveryTab = ref((route.query.tab as string) || savedDiscoveryTab.value)
const discoveryMode = ref((route.query.mode as string) || savedDiscoveryMode.value)

discoveryStore.discoveryMode = discoveryMode.value

function syncDiscoveryQuery() {
  const query = { ...route.query } as Record<string, string>
  if (discoveryTab.value !== 'all') query.tab = discoveryTab.value
  else delete query.tab
  if (discoveryMode.value !== 'all') query.mode = discoveryMode.value
  else delete query.mode
  router.replace({ query })
}

function changeDiscoveryTab(tab: string) {
  discoveryTab.value = tab
  savedDiscoveryTab.value = tab
  syncDiscoveryQuery()
  if (tab === 'novel' && !discoveryStore.novelDiscoveryList.length) {
    discoveryStore.fetchNovelDiscovery()
  }
}

function changeDiscoveryMode(mode: string) {
  discoveryMode.value = mode
  savedDiscoveryMode.value = mode
  discoveryStore.discoveryMode = mode
  syncDiscoveryQuery()
  refreshDiscovery()
}

const isDiscoveryLoading = computed(() =>
  discoveryTab.value === 'novel'
    ? discoveryStore.loadingNovelDiscovery
    : discoveryStore.loadingDiscovery
)

function refreshDiscovery() {
  if (discoveryTab.value === 'novel') {
    discoveryStore.fetchNovelDiscovery()
  } else {
    discoveryStore.fetchDiscovery()
  }
}

function scrollToDiscovery() {
  discoverRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// Infinite scroll observer
useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    if (discoveryTab.value === 'novel') {
      discoveryStore.appendNovelDiscovery()
    } else {
      discoveryStore.appendDiscovery()
    }
  }
})

// Fetch following when login state becomes available (async session init)
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn && !homeStore.followingList.length) {
    homeStore.fetchFollowing()
  }
}, { immediate: true })

onMounted(() => {
  setTitle()
  syncDiscoveryQuery()
  if (!homeStore.randomBg) {
    homeStore.fetchRandomBg()
  }
  if (!homeStore.rankingList.length) {
    homeStore.fetchRanking()
  }
  if (!discoveryStore.discoveryList.length) {
    discoveryStore.fetchDiscovery()
  }
})
</script>

<style lang="scss">
#home-view {
  // ── Hero ──
  .hero-section {
    min-height: 65vh;
    margin-top: -63px;
    padding: 30px 10%;
    padding-top: 93px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
    position: relative;
    color: #fff;
    text-shadow: 0 0 2px #222;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 0;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    width: 100%;
    max-width: 600px;
  }

  .site-logo {
    img {
      height: 10rem;
      width: auto;
    }
    margin-bottom: 0.25rem;
  }

  .description {
    margin-bottom: 2rem;
  }

  .search-area {
    margin-bottom: 0.75rem;

    > * {
      width: 100%;
    }
  }

  .quick-links {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;

    .fnb-tag {
      color: #fff;
      background: rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(4px);
      text-shadow: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      &:hover {
        background: var(--fnb-highlight);
        color: var(--fnb-text);
        border-color: var(--fnb-border);
      }
    }
  }

  .bg-info {
    position: absolute;
    right: 1.5rem;
    bottom: 1rem;
    font-size: 1.25rem;
    z-index: 1;

    a {
      color: #fff;
    }
  }

  // ── Background Info Modal (reuse existing dialog styles) ──
  .bg-info-modal {
    .thumb {
      display: block;
      text-align: center;

      img {
        max-width: 100%;
        max-height: 60vh;
        object-fit: contain;
      }
    }
    .desc {
      margin-top: 1rem;
      font-size: 0.75rem;
      font-style: italic;
    }
  }

  // ── Body content below hero ──
  > .body-inner {
    margin-top: 1.5rem;
  }

  // ── User Status Card ──
  .user-status-card {
    margin-bottom: 1.5rem;
  }

  // ── Two-Column Grid ──
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
    margin-bottom: 2rem;
    align-items: start;
  }

  .content-left,
  .content-right {
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  .content-right {
    .following-latest {
      display: flex;
      flex-direction: column;
      max-height: calc(360px + 2rem + 1.1rem + 0.75rem);
    }

    .fnb-card {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
  }

  @media (max-width: 768px) {
    .content-right .following-latest {
      max-height: 320px;
    }
  }

  .section-title {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ranking-skeleton {
    @include fnb-border;
    overflow: hidden;
  }

  // ── Discovery ──
  .discover {
    margin-top: 1rem;
  }

  .discover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;

    h2 {
      font-family: var(--fnb-font-display);
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }
  }

  .discover-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .discover-footer {
    margin-top: 2rem;
    text-align: center;

    .loading-more {
      display: flex;
      justify-content: center;
    }

    .login-prompt {
      padding: 2rem;
      color: var(--fnb-text-muted);

      p {
        margin-bottom: 0.75rem;
        font-weight: 700;
      }
    }
  }
}

// ── Dialog styles (used by other pages too) ──
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

// ── Responsive ──
@media (max-width: 768px) {
  #home-view {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .hero-section {
      padding: 30px 5%;
      padding-top: 93px;
    }
  }
}
</style>
