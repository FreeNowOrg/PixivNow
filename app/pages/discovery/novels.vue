<template lang="pug">
#discovery-novels
  NovelList(
    :list='discoveryStore.novelDiscoveryList',
    :loading='discoveryStore.loadingNovelDiscovery'
  )
  .discover-footer(v-if='!discoveryStore.loadingNovelDiscovery')
    .loading-more(v-if='userStore.isLoggedIn && discoveryStore.loadingMoreNovelDiscovery')
      FnbSkeleton(block, height='2rem', width='200px')
    .login-prompt(v-else-if='!userStore.isLoggedIn && discoveryStore.novelDiscoveryList.length')
      p 登录后解锁无限浏览
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        to='/login?back=/discovery/novels'
      )
        template(#icon): ITablerLogin
        | 登录
    div(v-else-if='userStore.isLoggedIn', ref='scrollSentinel')
</template>

<script lang="ts" setup>
import NovelList from '~/components/Novel/NovelList.vue'
import { IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const scrollSentinel = ref<HTMLElement | null>(null)

useIntersectionObserver(scrollSentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && userStore.isLoggedIn) {
    discoveryStore.appendNovelDiscovery()
  }
})

onMounted(() => {
  if (!discoveryStore.novelDiscoveryList.length) {
    discoveryStore.fetchNovelDiscovery()
  }
})
</script>

<style lang="scss" scoped>
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
</style>
