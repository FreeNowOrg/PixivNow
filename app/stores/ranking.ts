import { defineStore } from 'pinia'
import type { RankedArtworkInfo, RankedNovelInfo } from '~/types'

export const useRankingStore = defineStore('ranking', () => {
  const rankingData = ref<{
    date: string
    contents: RankedArtworkInfo[]
  } | null>(null)
  const novelRankingData = ref<{
    date: string
    contents: RankedNovelInfo[]
  } | null>(null)
  const loading = ref(false)
  const pixivClient = usePixivClient()

  async function fetchRanking(params?: {
    p?: string
    mode?: string
    date?: string
    content?: string
  }): Promise<void> {
    loading.value = true
    try {
      const data = await pixivClient.getRanking({
        p: params?.p ? Number(params.p) : undefined,
        mode: params?.mode,
        date: params?.date,
        content: params?.content,
      })
      rankingData.value = {
        date: data.date,
        contents: data.contents,
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchNovelRanking(params?: {
    p?: string
    mode?: string
  }): Promise<void> {
    loading.value = true
    try {
      const data = await pixivClient.getNovelRanking({
        p: params?.p ? Number(params.p) : undefined,
        mode: params?.mode,
      })
      novelRankingData.value = {
        date: data.date,
        contents: data.contents,
      }
    } finally {
      loading.value = false
    }
  }

  function reset() {
    rankingData.value = null
    novelRankingData.value = null
  }

  return {
    rankingData,
    novelRankingData,
    loading,
    fetchRanking,
    fetchNovelRanking,
    reset,
  }
})
