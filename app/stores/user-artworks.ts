import { defineStore } from 'pinia'
import type { ArtworkInfo } from '~/types'

export const useUserArtworksStore = defineStore('user-artworks', () => {
  const pixivClient = usePixivClient()
  const pageSize = 24

  const state = ref<
    Record<
      string,
      { allIds: string[]; cachedPages: Record<number, ArtworkInfo[]> }
    >
  >({})

  function getState(category: string) {
    if (!state.value[category]) {
      state.value[category] = { allIds: [], cachedPages: {} }
    }
    return state.value[category]
  }

  function allIds(category: string) {
    return getState(category).allIds
  }

  function cachedPages(category: string) {
    return getState(category).cachedPages
  }

  async function fetchAllIds(
    userId: string,
    workCategory: 'illust' | 'manga'
  ): Promise<string[]> {
    const s = getState(workCategory)
    s.allIds = []
    s.cachedPages = {}
    const data = await pixivClient.getUserProfileAll(userId)
    const works =
      workCategory === 'illust'
        ? Object.keys(data.illusts)
        : Object.keys(data.manga)
    s.allIds = works.sort((a, b) => Number(b) - Number(a))
    return s.allIds
  }

  function getIdsByPage(category: string, page: number): string[] {
    return getState(category).allIds.slice(
      (page - 1) * pageSize,
      page * pageSize
    )
  }

  async function fetchPage(
    userId: string,
    page: number,
    workCategory: 'illust' | 'manga'
  ): Promise<ArtworkInfo[]> {
    const s = getState(workCategory)
    if (s.cachedPages[page]) return s.cachedPages[page]
    const ids = getIdsByPage(workCategory, page)
    const works = await pixivClient.getUserIllusts(userId, ids, workCategory)
    s.cachedPages[page] = Object.values(works)
    return s.cachedPages[page]
  }

  function reset() {
    state.value = {}
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
