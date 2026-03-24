import { defineStore } from 'pinia'
import { pixivClient } from '@/api/pixiv-client'
import type { ArtworkInfo } from '@/types'

export const useHomeStore = defineStore('home', () => {
  const randomBg = ref<ArtworkInfo | null>(null)
  const discoveryList = ref<ArtworkInfo[]>([])
  const loadingDiscovery = ref(false)

  async function fetchRandomBg(): Promise<void> {
    try {
      const illusts = await pixivClient.getDiscovery({ mode: 'safe', max: 1 })
      if (illusts.length) {
        randomBg.value = illusts[0]
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchDiscovery(): Promise<void> {
    if (loadingDiscovery.value) return
    try {
      loadingDiscovery.value = true
      const illusts = await pixivClient.getDiscovery({ mode: 'all', max: 8 })
      discoveryList.value = illusts
    } catch (err) {
      console.error('Failed to fetch discovery', err)
    } finally {
      loadingDiscovery.value = false
    }
  }

  return {
    randomBg,
    discoveryList,
    loadingDiscovery,
    fetchRandomBg,
    fetchDiscovery,
  }
})
