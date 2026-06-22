import { defineStore } from 'pinia'
import type { ArtworkInfo, NovelInfo, UserListItem } from '~/types'

export const useDiscoveryStore = defineStore('discovery', () => {
  const pixivClient = usePixivClient()

  const discoveryMode = ref('all')

  const discoveryList = ref<ArtworkInfo[]>([])
  const loadingDiscovery = ref(false)
  const loadingMoreDiscovery = ref(false)
  const noMoreDiscovery = ref(false)
  const discoverySeenIds = new Set<string>()

  const novelDiscoveryList = ref<NovelInfo[]>([])
  const loadingNovelDiscovery = ref(false)
  const loadingMoreNovelDiscovery = ref(false)
  const noMoreNovelDiscovery = ref(false)
  const novelDiscoverySeenIds = new Set<string>()

  const userDiscoveryList = ref<UserListItem[]>([])
  const loadingUserDiscovery = ref(false)
  const loadingMoreUserDiscovery = ref(false)
  const noMoreUserDiscovery = ref(false)
  const userDiscoverySeenIds = new Set<string>()

  async function fetchDiscovery(): Promise<void> {
    if (loadingDiscovery.value) return
    try {
      loadingDiscovery.value = true
      const illusts = await pixivClient.getDiscovery({ mode: discoveryMode.value, limit: 60 })
      discoverySeenIds.clear()
      noMoreDiscovery.value = false
      illusts.forEach((item) => discoverySeenIds.add(item.id))
      discoveryList.value = illusts
    } catch (err) {
      console.error('Failed to fetch discovery', err)
    } finally {
      loadingDiscovery.value = false
    }
  }

  async function appendDiscovery(): Promise<void> {
    if (loadingMoreDiscovery.value || noMoreDiscovery.value) return
    try {
      loadingMoreDiscovery.value = true
      const illusts = await pixivClient.getDiscovery({ mode: discoveryMode.value, limit: 60 })
      const fresh = illusts.filter((item) => !discoverySeenIds.has(item.id))
      if (!fresh.length) {
        noMoreDiscovery.value = true
        return
      }
      fresh.forEach((item) => discoverySeenIds.add(item.id))
      discoveryList.value = [...discoveryList.value, ...fresh]
    } catch (err) {
      console.error('Failed to append discovery', err)
    } finally {
      loadingMoreDiscovery.value = false
    }
  }

  async function fetchNovelDiscovery(): Promise<void> {
    if (loadingNovelDiscovery.value) return
    try {
      loadingNovelDiscovery.value = true
      const novels = await pixivClient.getNovelDiscovery({
        mode: discoveryMode.value,
        limit: 60,
      })
      novelDiscoverySeenIds.clear()
      noMoreNovelDiscovery.value = false
      novels.forEach((item) => novelDiscoverySeenIds.add(item.id))
      novelDiscoveryList.value = novels
    } catch (err) {
      console.error('Failed to fetch novel discovery', err)
    } finally {
      loadingNovelDiscovery.value = false
    }
  }

  async function appendNovelDiscovery(): Promise<void> {
    if (loadingMoreNovelDiscovery.value || noMoreNovelDiscovery.value) return
    try {
      loadingMoreNovelDiscovery.value = true
      const novels = await pixivClient.getNovelDiscovery({
        mode: discoveryMode.value,
        limit: 60,
      })
      const fresh = novels.filter((item) => !novelDiscoverySeenIds.has(item.id))
      if (!fresh.length) {
        noMoreNovelDiscovery.value = true
        return
      }
      fresh.forEach((item) => novelDiscoverySeenIds.add(item.id))
      novelDiscoveryList.value = [...novelDiscoveryList.value, ...fresh]
    } catch (err) {
      console.error('Failed to append novel discovery', err)
    } finally {
      loadingMoreNovelDiscovery.value = false
    }
  }

  async function fetchUserDiscovery(): Promise<void> {
    if (loadingUserDiscovery.value) return
    try {
      loadingUserDiscovery.value = true
      const users = await pixivClient.getDiscoveryUsers({ limit: 100 })
      userDiscoverySeenIds.clear()
      noMoreUserDiscovery.value = false
      users.forEach((u) => userDiscoverySeenIds.add(u.userId))
      userDiscoveryList.value = users
    } catch (err) {
      console.error('Failed to fetch user discovery', err)
    } finally {
      loadingUserDiscovery.value = false
    }
  }

  async function appendUserDiscovery(): Promise<void> {
    if (loadingMoreUserDiscovery.value || noMoreUserDiscovery.value) return
    try {
      loadingMoreUserDiscovery.value = true
      const users = await pixivClient.getDiscoveryUsers({ limit: 20 })
      const fresh = users.filter((u) => !userDiscoverySeenIds.has(u.userId))
      if (!fresh.length) {
        noMoreUserDiscovery.value = true
        return
      }
      fresh.forEach((u) => userDiscoverySeenIds.add(u.userId))
      userDiscoveryList.value = [...userDiscoveryList.value, ...fresh]
    } catch (err) {
      console.error('Failed to append user discovery', err)
    } finally {
      loadingMoreUserDiscovery.value = false
    }
  }

  return {
    discoveryMode,
    discoveryList,
    loadingDiscovery,
    loadingMoreDiscovery,
    noMoreDiscovery,
    fetchDiscovery,
    appendDiscovery,
    novelDiscoveryList,
    loadingNovelDiscovery,
    loadingMoreNovelDiscovery,
    noMoreNovelDiscovery,
    fetchNovelDiscovery,
    appendNovelDiscovery,
    userDiscoveryList,
    loadingUserDiscovery,
    loadingMoreUserDiscovery,
    noMoreUserDiscovery,
    fetchUserDiscovery,
    appendUserDiscovery,
  }
})
