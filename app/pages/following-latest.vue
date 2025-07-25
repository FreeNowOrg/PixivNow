<template lang="pug">
#following-latest-view.body-inner
  h1 已关注用户的作品
  ArtworkList(:list='illusts', :loading='isLoading && !illusts.length')
  ShowMore(
    :loading='isLoading',
    :method='fetchList',
    :text='isLoading ? "加载中" : "加载更多"'
    v-if='hasNextPage && illusts.length'
  )
</template>

<script lang="ts" setup>
type FollowLatest = {
  page: {
    isLastPage: boolean
  }
  thumbnails: {
    illust: ArtworkInfo[]
  }
}

const illusts = ref<ArtworkInfo[]>([])
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const nextPage = ref(1)
const hasNextPage = ref(true)
const isLoading = ref(false)

async function fetchList() {
  if (!userStore.isLoggedIn) {
    return router.push({
      name: 'user-login',
      query: { back: route.fullPath },
    })
  }
  if (isLoading.value) return
  isLoading.value = true

  try {
    const data = await useAjaxResponse<FollowLatest>(
      `/ajax/follow_latest/illust`,
      {
        params: { p: nextPage.value, mode: 'all' },
      }
    )
    illusts.value.push(...data.thumbnails.illust)
    nextPage.value++
    hasNextPage.value = !data.page.isLastPage
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  useHead({ title: 'New Artworks from Following Users' })
  fetchList()
})
</script>
