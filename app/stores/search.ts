import { defineStore } from 'pinia'
import type { ArtworkInfo, NovelInfo } from '~/types'

export const useSearchStore = defineStore('search', () => {
  const pixivClient = usePixivClient()
  const results = ref<ArtworkInfo[]>([])
  const total = ref(0)
  const loading = ref(false)

  const novelResults = ref<NovelInfo[]>([])
  const novelTotal = ref(0)

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

  async function searchNovels(
    keyword: string,
    params?: { p?: number; mode?: string; s_mode?: string; order?: string }
  ): Promise<void> {
    if (!keyword) return
    loading.value = true
    try {
      const data = await pixivClient.searchNovels(keyword, params)
      novelResults.value = data.data
      novelTotal.value = data.total
    } finally {
      loading.value = false
    }
  }

  function reset() {
    results.value = []
    total.value = 0
    novelResults.value = []
    novelTotal.value = 0
  }

  return {
    results,
    total,
    novelResults,
    novelTotal,
    loading,
    search,
    searchNovels,
    reset,
  }
})
