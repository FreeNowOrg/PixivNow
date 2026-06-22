import { defineStore } from 'pinia'
import type { RankedArtworkInfo } from '~/types'

export const useRankingStore = defineStore('ranking', () => {
  const rankingData = ref<{
    date: Date
    contents: RankedArtworkInfo[]
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
