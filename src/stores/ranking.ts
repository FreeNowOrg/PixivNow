import { defineStore } from 'pinia'
import { pixivClient } from '@/api/pixiv-client'
import type { ArtworkRank } from '@/types'

export const useRankingStore = defineStore('ranking', () => {
  const rankingData = ref<{
    date: Date
    contents: ArtworkRank[]
  } | null>(null)
  const loading = ref(false)

  async function fetchRanking(params?: {
    p?: string
    mode?: string
    date?: string
  }): Promise<void> {
    loading.value = true
    try {
      const data = await pixivClient.getRanking({
        p: params?.p ? Number(params.p) : undefined,
        mode: params?.mode,
        date: params?.date,
      })
      const rankingDate = data.date
      rankingData.value = {
        date: new Date(
          +rankingDate.substring(0, 4),
          +rankingDate.substring(4, 6) - 1,
          +rankingDate.substring(6, 8)
        ),
        contents: data.contents,
      }
    } finally {
      loading.value = false
    }
  }

  function reset() {
    rankingData.value = null
  }

  return { rankingData, loading, fetchRanking, reset }
})
