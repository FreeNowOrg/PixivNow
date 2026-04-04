<template lang="pug">
#following-latest-view.body-inner
  h1 已关注用户的作品
  ArtworkList(
    :list='followingStore.latestIllusts',
    :loading='followingStore.latestLoading && !followingStore.latestIllusts.length'
  )
  ShowMore(
    :loading='followingStore.latestLoading',
    :method='handleFetch',
    :text='followingStore.latestLoading ? "加载中" : "加载更多"'
    v-if='followingStore.latestHasNextPage && followingStore.latestIllusts.length'
  )
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'following-latest',
  alias: ['/bookmark_new_illust'],
})
import { useUserStore } from '~/composables/session'
import { useFollowingStore } from '~/composables/following'

onMounted(() => {
  setTitle('New Artworks from Following Users')
  followingStore.resetLatest()
  handleFetch()
})

const userStore = useUserStore()
const followingStore = useFollowingStore()
const route = useRoute()
const router = useRouter()

async function handleFetch() {
  if (!userStore.isLoggedIn) {
    return router.push(`/login?back=${encodeURIComponent(route.fullPath)}`)
  }
  followingStore.fetchLatest()
}
</script>
