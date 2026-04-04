export const useFollowingStore = defineStore('following', () => {
  // Following list state
  const publicList = ref<UserListItem[]>([])
  const hiddenList = ref<UserListItem[]>([])
  const totalPublic = ref(0)
  const totalHidden = ref(0)
  const isLoadingPublic = ref(false)
  const isLoadingHidden = ref(false)
  const title = ref('Following')

  const hasMorePublic = computed(
    () => totalPublic.value > publicList.value.length
  )
  const hasMoreHidden = computed(
    () => totalHidden.value > hiddenList.value.length
  )

  async function fetchFollowingList(
    userId: string,
    hidden: boolean
  ): Promise<void> {
    const pixivClient = usePixivClientStore().client
    const list = hidden ? hiddenList : publicList
    const isLoading = hidden ? isLoadingHidden : isLoadingPublic
    const total = hidden ? totalHidden : totalPublic

    if (isLoading.value) return
    isLoading.value = true

    try {
      const data = await pixivClient.getUserFollowing(userId, {
        offset: list.value.length,
        limit: 24,
        rest: hidden ? 'hide' : 'show',
      })
      list.value.push(...data.users)
      total.value = data.total
      title.value = data.extraData.meta.ogp.title || 'Following'
    } finally {
      isLoading.value = false
    }
  }

  function resetFollowing() {
    publicList.value = []
    hiddenList.value = []
    totalPublic.value = 0
    totalHidden.value = 0
    isLoadingPublic.value = false
    isLoadingHidden.value = false
    title.value = 'Following'
  }

  // Following latest state
  const latestIllusts = ref<ArtworkInfo[]>([])
  const latestNextPage = ref(1)
  const latestHasNextPage = ref(true)
  const latestLoading = ref(false)

  async function fetchLatest(): Promise<void> {
    if (latestLoading.value) return
    latestLoading.value = true
    try {
      const pixivClient = usePixivClientStore().client
      const data = await pixivClient.getFollowLatest({
        p: latestNextPage.value,
        mode: 'all',
      })
      latestIllusts.value.push(...data.thumbnails.illust)
      latestNextPage.value++
      latestHasNextPage.value = !data.page.isLastPage
    } finally {
      latestLoading.value = false
    }
  }

  function resetLatest() {
    latestIllusts.value = []
    latestNextPage.value = 1
    latestHasNextPage.value = true
    latestLoading.value = false
  }

  return {
    publicList,
    hiddenList,
    totalPublic,
    totalHidden,
    isLoadingPublic,
    isLoadingHidden,
    hasMorePublic,
    hasMoreHidden,
    title,
    fetchFollowingList,
    resetFollowing,
    latestIllusts,
    latestNextPage,
    latestHasNextPage,
    latestLoading,
    fetchLatest,
    resetLatest,
  }
})
