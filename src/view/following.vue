<template lang="pug">
#about-view.body-inner
  h1
    .flex.gap-1
      NButton(
        @click='$router.push({ name: "users", params: { id: targetUserId } })'
        circle
        secondary
      )
        template(#icon)
          IChevronLeft
      .first-heading {{ title }}

  NTabs(
    :bar-width='32'
    justify-content='space-evenly'
    type='line'
    v-model:value='tab'
  )
    NTabPane(display-directive='show:lazy' name='public' tab='公开关注')
      .user-list
        Card(
          title=''
          v-for='_ in 8'
          v-if='publicList.length === 0 && isLoadingPublic'
        )
          FollowUserCard
        Card(:key='user.userId' title='' v-for='user in publicList')
          FollowUserCard(:user='user')
        ShowMore(
          :loading='isLoadingPublic',
          :method='() => fetchList(false)',
          :text='isLoadingPublic ? "加载中..." : "加载更多"'
          v-if='hasMorePublic'
        )
    NTabPane(
      :disabled='!isSelfPage'
      display-directive='show:lazy'
      name='hidden'
      tab='私密关注'
    )
      .user-list
        Card(
          title=''
          v-for='_ in 8'
          v-if='hiddenList.length === 0 && isLoadingHidden'
        )
          FollowUserCard
        Card(:key='user.userId' title='' v-for='user in hiddenList')
          FollowUserCard(:user='user')
        ShowMore(
          :loading='isLoadingHidden',
          :method='() => fetchList(true)',
          :text='isLoadingHidden ? "加载中..." : "加载更多"'
          v-if='hasMoreHidden'
        )
</template>

<script lang="ts" setup>
import type { UserListItem } from '@/types'
import IChevronLeft from '~icons/fa-solid/chevron-left'

onMounted(() => {
  setTitle('Following')
  resetAll('' + route.params.id)
  fetchList(false)
})
onBeforeRouteUpdate((to, from) => {
  if (to.name === from.name && to.params.id !== from.params.id) {
    resetAll('' + to.params.id)
    fetchList(false)
  }
})

const route = useRoute()
const targetUserId = ref(route.params.id)

const tab = ref<'public' | 'hidden'>('public')

const publicList = ref<UserListItem[]>([])
const isLoadingPublic = ref(false)
const totalPublic = ref(0)
const hasMorePublic = computed(
  () => totalPublic.value > publicList.value.length
)

const hiddenList = ref<UserListItem[]>([])
const isLoadingHidden = ref(false)
const totalHidden = ref(0)
const hasMoreHidden = computed(
  () => totalHidden.value > hiddenList.value.length
)

const userStore = useUserStore()
const isSelfPage = computed(() => userStore.userId === targetUserId.value)
const title = ref('Following')

function resetAll(userId: string) {
  targetUserId.value = userId
  tab.value = 'public'
  publicList.value = []
  hiddenList.value = []
  totalPublic.value = 0
  totalHidden.value = 0
  isLoadingPublic.value = false
  isLoadingHidden.value = false
}
async function fetchList(hidden?: boolean) {
  const list = hidden ? hiddenList : publicList
  const isLoading = hidden ? isLoadingHidden : isLoadingPublic
  const total = hidden ? totalHidden : totalPublic

  if (isLoading.value) return
  isLoading.value = true

  try {
    const { data } = await ajax.get<{
      total: number
      users: UserListItem[]
      extraData: {
        meta: {
          ogp: {
            title: string
            image: string
            description: string
          }
        }
      }
    }>(`/ajax/user/${targetUserId.value}/following`, {
      params: {
        offset: list.value.length,
        limit: 24,
        rest: hidden ? 'hide' : 'show',
      },
    })
    list.value.push(...data.users)
    total.value = data.total
    title.value = data.extraData.meta.ogp.title || 'Following'
    setTitle(title.value)
  } finally {
    isLoading.value = false
  }
}

watch(tab, (newTab) => {
  const isPublicEmpty = !publicList.value.length
  const isHiddenEmpty = !hiddenList.value.length

  if (newTab === 'public' && isPublicEmpty) {
    fetchList(false)
  }
  if (newTab === 'hidden' && isHiddenEmpty) {
    fetchList(true)
  }
})
</script>

<style scoped lang="sass">
#about-view
  padding-top: 2rem

h1
  margin-top: 0

.user-list
  .card:not(:first-of-type)
    margin-top: 1rem
</style>
