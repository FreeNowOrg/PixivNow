<template lang="pug">
#about-view.body-inner
  h1
    .flex.gap-1
      FnbButton(
        @click='$router.push(`/users/${targetUserId}`)'
        size='sm'
        variant='default'
      )
        template(#icon)
          IChevronLeft
      .first-heading {{ followingStore.title }}

  FnbTabs(
    v-model='tab'
    :tabs='tabsList'
  )
    template(#panel-public)
      .user-list
        Card(
          title=''
          v-for='_ in 8'
          v-if='followingStore.publicList.length === 0 && followingStore.isLoadingPublic'
        )
          FollowUserCard
        Card(:key='user.userId' title='' v-for='user in followingStore.publicList')
          FollowUserCard(:user='user')
        ShowMore(
          :loading='followingStore.isLoadingPublic',
          :method='() => followingStore.fetchFollowingList("" + targetUserId, false)',
          :text='followingStore.isLoadingPublic ? "加载中..." : "加载更多"'
          v-if='followingStore.hasMorePublic'
        )
    template(#panel-hidden v-if='isSelfPage')
      .user-list
        Card(
          title=''
          v-for='_ in 8'
          v-if='followingStore.hiddenList.length === 0 && followingStore.isLoadingHidden'
        )
          FollowUserCard
        Card(:key='user.userId' title='' v-for='user in followingStore.hiddenList')
          FollowUserCard(:user='user')
        ShowMore(
          :loading='followingStore.isLoadingHidden',
          :method='() => followingStore.fetchFollowingList("" + targetUserId, true)',
          :text='followingStore.isLoadingHidden ? "加载中..." : "加载更多"'
          v-if='followingStore.hasMoreHidden'
        )
</template>

<script lang="ts" setup>
definePageMeta({ name: 'following' })
import IChevronLeft from '~icons/fa-solid/chevron-left'
import { useUserStore } from '~/stores/session'
import { useFollowingStore } from '~/stores/following'

onMounted(() => {
  setTitle('Following')
  resetAndFetch('' + route.params.id)
})
onBeforeRouteUpdate((to, from) => {
  if (to.name === from.name && to.params.id !== from.params.id) {
    resetAndFetch('' + to.params.id)
  }
})

const route = useRoute()
const targetUserId = ref(route.params.id)

const tab = ref<string>('public')

const userStore = useUserStore()
const followingStore = useFollowingStore()
const isSelfPage = computed(() => userStore.userId === targetUserId.value)

const tabsList = computed(() => {
  const list = [{ key: 'public', label: '公开关注' }]
  if (isSelfPage.value) {
    list.push({ key: 'hidden', label: '私密关注' })
  }
  return list
})

function resetAndFetch(userId: string) {
  targetUserId.value = userId
  tab.value = 'public'
  followingStore.resetFollowing()
  followingStore.fetchFollowingList(userId, false)
}

watch(tab, (newTab) => {
  const isPublicEmpty = !followingStore.publicList.length
  const isHiddenEmpty = !followingStore.hiddenList.length

  if (newTab === 'public' && isPublicEmpty) {
    followingStore.fetchFollowingList('' + targetUserId.value, false)
  }
  if (newTab === 'hidden' && isHiddenEmpty) {
    followingStore.fetchFollowingList('' + targetUserId.value, true)
  }
})
</script>

<style scoped lang="scss">
#about-view {
  padding-top: 2rem;
}

h1 {
  margin-top: 0;
}

.user-list {
  .card:not(:first-of-type) {
    margin-top: 1rem;
  }
}
</style>
