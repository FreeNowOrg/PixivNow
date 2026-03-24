import { defineStore } from 'pinia'
import { pixivClient } from '~/api/pixiv-client'
import type { ArtworkInfo } from '~/types'

export const useSearchStore = defineStore('search', () => {
  const results = ref<ArtworkInfo[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function search(
    keyword: string,
    params?: { p?: number; mode?: string }
  ): Promise<void> {
    if (!keyword) return
    loading.value = true
    try {
      const data = await pixivClient.searchArtworks(keyword, params)
      results.value = data.data
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  function reset() {
    results.value = []
    total.value = 0
  }

  return { results, total, loading, search, reset }
})
