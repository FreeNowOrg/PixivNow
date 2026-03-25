import { defineStore } from 'pinia'
import type { ArtworkInfo } from '~/types'

export const useUserArtworksStore = defineStore('user-artworks', () => {
  const pixivClient = usePixivClientStore().client
  const allIds = ref<string[]>([])
  const cachedPages = ref<Record<number, ArtworkInfo[]>>({})
  const pageSize = 24

  async function fetchAllIds(
    userId: string,
    workCategory: 'illust' | 'manga'
  ): Promise<string[]> {
    allIds.value = []
    cachedPages.value = {}
    const data = await pixivClient.getUserProfileAll(userId)
    const works =
      workCategory === 'illust'
        ? Object.keys(data.illusts)
        : Object.keys(data.manga)
    allIds.value = works.sort((a, b) => Number(b) - Number(a))
    return allIds.value
  }

  function getIdsByPage(page: number): string[] {
    return allIds.value.slice((page - 1) * pageSize, page * pageSize)
  }

  async function fetchPage(
    userId: string,
    page: number,
    workCategory: 'illust' | 'manga'
  ): Promise<ArtworkInfo[]> {
    if (cachedPages.value[page]) return cachedPages.value[page]
    const ids = getIdsByPage(page)
    const works = await pixivClient.getUserIllusts(userId, ids, workCategory)
    cachedPages.value[page] = Object.values(works)
    return cachedPages.value[page]
  }

  function reset() {
    allIds.value = []
    cachedPages.value = {}
  }

  return {
    allIds,
    cachedPages,
    pageSize,
    fetchAllIds,
    getIdsByPage,
    fetchPage,
    reset,
  }
})
