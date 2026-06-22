import { defineStore } from 'pinia'
import type { ArtworkInfo, NovelInfo, RankedArtworkInfo } from '~/types'

export const useHomeStore = defineStore('home', () => {
  const pixivClient = usePixivClient()
  const randomBg = ref<ArtworkInfo | null>(null)
  const discoveryList = ref<ArtworkInfo[]>([])
  const loadingDiscovery = ref(false)

  const rankingList = ref<RankedArtworkInfo[]>([])
  const loadingRanking = ref(false)

  const followingList = ref<ArtworkInfo[]>([])
  const loadingFollowing = ref(false)

  const discoverySeenIds = new Set<string>()
  const loadingMoreDiscovery = ref(false)
  const noMoreDiscovery = ref(false)
  const discoveryMode = ref('all')

  const novelDiscoveryList = ref<NovelInfo[]>([])
  const loadingNovelDiscovery = ref(false)
  const loadingMoreNovelDiscovery = ref(false)
  const noMoreNovelDiscovery = ref(false)
  const novelDiscoverySeenIds = new Set<string>()

  async function fetchRandomBg(): Promise<void> {
    try {
      const illusts = await pixivClient.getDiscovery({ mode: 'safe', limit: 1 })
      if (illusts.length) {
        randomBg.value = illusts[0]!
      }
    } catch (err) {
      console.error(err)
    }
  }

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

  async function fetchRanking(): Promise<void> {
    if (loadingRanking.value) return
    try {
      loadingRanking.value = true
      const data = await pixivClient.getRanking({ mode: 'daily', content: 'all', p: 1 })
      rankingList.value = data.contents.slice(0, 5)
    } catch (err) {
      console.error('Failed to fetch ranking', err)
    } finally {
      loadingRanking.value = false
    }
  }

  async function fetchFollowing(): Promise<void> {
    if (loadingFollowing.value) return
    try {
      loadingFollowing.value = true
      const data = await pixivClient.getFollowLatest({ p: 1, mode: 'all' })
      followingList.value = data.thumbnails.illust
    } catch (err) {
      console.error('Failed to fetch following', err)
    } finally {
      loadingFollowing.value = false
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
      const fresh = novels.filter(
        (item) => !novelDiscoverySeenIds.has(item.id)
      )
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

  return {
    randomBg,
    discoveryList,
    loadingDiscovery,
    fetchRandomBg,
    fetchDiscovery,
    rankingList,
    loadingRanking,
    fetchRanking,
    followingList,
    loadingFollowing,
    fetchFollowing,
    loadingMoreDiscovery,
    noMoreDiscovery,
    appendDiscovery,
    discoveryMode,
    novelDiscoveryList,
    loadingNovelDiscovery,
    loadingMoreNovelDiscovery,
    noMoreNovelDiscovery,
    fetchNovelDiscovery,
    appendNovelDiscovery,
  }
})
