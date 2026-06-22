import { defineStore } from 'pinia'
import type { ArtworkInfo, RankedArtworkInfo } from '~/types'

export const useHomeStore = defineStore('home', () => {
  const pixivClient = usePixivClient()
  const randomBg = ref<ArtworkInfo | null>(null)

  const rankingList = ref<RankedArtworkInfo[]>([])
  const loadingRanking = ref(false)

  const followingList = ref<ArtworkInfo[]>([])
  const loadingFollowing = ref(false)

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

  return {
    randomBg,
    fetchRandomBg,
    rankingList,
    loadingRanking,
    fetchRanking,
    followingList,
    loadingFollowing,
    fetchFollowing,
  }
})
