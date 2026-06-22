<template lang="pug">
#discovery-users
  //- endpoint requires auth — show login prompt directly, no request
  .login-prompt(v-if='!userStore.isLoggedIn')
    p 推荐用户需要登录后查看
    FnbButton(
      size='sm',
      variant='primary',
      tag='RouterLink',
      to='/login?back=/discovery/users'
    )
      template(#icon): ITablerLogin
      | 登录

  template(v-else)
    .user-list(v-if='visibleUsers.length')
      Card(v-for='u in visibleUsers', :key='u.userId')
        FollowUserCard(:user='u')
    .user-list(v-else-if='discoveryStore.loadingUserDiscovery')
      Card(v-for='n in 4', :key='n')
        FollowUserCard

    .discover-footer(v-if='!discoveryStore.loadingUserDiscovery && visibleUsers.length')
      .loading-more(v-if='discoveryStore.loadingMoreUserDiscovery')
        FnbSkeleton(block, height='2rem', width='200px')
      div(v-else-if='!atEnd', ref='scrollSentinel')
</template>

<script lang="ts" setup>
import { IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const scrollSentinel = ref<HTMLElement | null>(null)

const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)

const visibleUsers = computed(() =>
  discoveryStore.userDiscoveryList.slice(0, visibleCount.value)
)

// buffer fully revealed AND store says nothing more to fetch
const atEnd = computed(
  () =>
    visibleCount.value >= discoveryStore.userDiscoveryList.length &&
    discoveryStore.noMoreUserDiscovery
)

function loadMore() {
  const buffered = discoveryStore.userDiscoveryList.length
  if (visibleCount.value < buffered) {
    // reveal more from the already-fetched buffer (no request)
    visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, buffered)
  } else if (!discoveryStore.noMoreUserDiscovery) {
    // buffer exhausted — fetch the next batch of 100
    discoveryStore.appendUserDiscovery()
  }
}

useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) loadMore()
})

// reset incremental reveal whenever a fresh batch replaces the list (换一批 / mode change / first load)
watch(
  () => discoveryStore.userDiscoveryEpoch,
  () => {
    visibleCount.value = PAGE_SIZE
  }
)

function maybeFetch() {
  if (userStore.isLoggedIn && !discoveryStore.userDiscoveryList.length) {
    discoveryStore.fetchUserDiscovery()
  }
}

// session init is async — react to login state becoming available
watch(() => userStore.isLoggedIn, () => maybeFetch(), { immediate: true })
onMounted(maybeFetch)
</script>

<style lang="scss" scoped>
.user-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  // Skip render/layout/image-decode for off-screen cards (heavy DOM).
  // `auto` remembers the real height after first paint to avoid scroll jump.
  > * {
    content-visibility: auto;
    contain-intrinsic-size: auto 220px;
  }
}

.discover-footer {
  margin-top: 2rem;
  text-align: center;

  .loading-more {
    display: flex;
    justify-content: center;
  }
}

.login-prompt {
  padding: 2rem;
  text-align: center;
  color: var(--fnb-text-muted);

  p {
    margin-bottom: 0.75rem;
    font-weight: 700;
  }
}
</style>
