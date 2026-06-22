import { defineStore } from 'pinia'
import type { ArtworkInfo, NovelInfo } from '~/types'

export type SearchContentType =
  | 'artworks'
  | 'illustrations'
  | 'manga'
  | 'novels'

export const useSearchStore = defineStore('search', () => {
  const pixivClient = usePixivClient()
  const artworkResults = ref<ArtworkInfo[]>([])
  const artworkTotal = ref(0)
  const novelResults = ref<NovelInfo[]>([])
  const novelTotal = ref(0)
  const loading = ref(false)

  async function searchArtworks(
    keyword: string,
    contentType: SearchContentType,
    params?: {
      p?: number
      mode?: string
      s_mode?: string
      order?: string
      ai_type?: string
      type?: string
    }
  ): Promise<void> {
    if (!keyword) return
    loading.value = true
    try {
      let data: { data: ArtworkInfo[]; total: number }
      switch (contentType) {
        case 'illustrations':
          data = await pixivClient.searchIllustrations(keyword, params)
          break
        case 'manga':
          data = await pixivClient.searchManga(keyword, params)
          break
        default:
          data = await pixivClient.searchArtworks(keyword, params)
      }
      artworkResults.value = data.data
      artworkTotal.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function searchNovels(
    keyword: string,
    params?: {
      p?: number
      mode?: string
      s_mode?: string
      order?: string
      ai_type?: string
      work_lang?: string
    }
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
    artworkResults.value = []
    artworkTotal.value = 0
    novelResults.value = []
    novelTotal.value = 0
  }

  return {
    artworkResults,
    artworkTotal,
    novelResults,
    novelTotal,
    loading,
    searchArtworks,
    searchNovels,
    reset,
  }
})
