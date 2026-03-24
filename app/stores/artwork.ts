import { defineStore } from 'pinia'
import { pixivClient } from '~/api/pixiv-client'
import type { Artwork, ArtworkGallery, ArtworkInfo } from '~/types'

export const useArtworkStore = defineStore('artwork', () => {
  const artworkCache = ref(new Map<string, Artwork>())
  const pagesCache = ref(new Map<string, ArtworkGallery[]>())

  const recommendations = ref<ArtworkInfo[]>([])
  const recommendNextIds = ref<string[]>([])

  function getCachedArtwork(id: string): Artwork | undefined {
    return artworkCache.value.get(id)
  }

  function getCachedPages(id: string): ArtworkGallery[] | undefined {
    return pagesCache.value.get(id)
  }

  async function fetchArtwork(id: string): Promise<Artwork> {
    const cached = artworkCache.value.get(id)
    if (cached) return cached

    const artwork = await pixivClient.getArtwork(id)
    artworkCache.value.set(id, artwork)
    return artwork
  }

  async function fetchArtworkPages(id: string): Promise<ArtworkGallery[]> {
    const cached = pagesCache.value.get(id)
    if (cached) return cached

    const pages = await pixivClient.getArtworkPages(id)
    pagesCache.value.set(id, pages)
    return pages
  }

  async function fetchRecommendInit(
    id: string
  ): Promise<{ illusts: ArtworkInfo[]; nextIds: string[] }> {
    const result = await pixivClient.getRecommendInit(id, 18)
    recommendations.value = result.illusts
    recommendNextIds.value = result.nextIds
    return result
  }

  async function fetchRecommendMore(): Promise<void> {
    if (!recommendNextIds.value.length) return
    const ids = recommendNextIds.value.splice(0, 18)
    const result = await pixivClient.getRecommendMore(ids)
    recommendations.value = recommendations.value.concat(result.illusts)
    recommendNextIds.value = recommendNextIds.value.concat(result.nextIds)
  }

  async function addBookmark(illustId: string | number): Promise<any> {
    return pixivClient.addBookmark(illustId)
  }

  async function removeBookmark(bookmarkId: string | number): Promise<any> {
    return pixivClient.removeBookmark(bookmarkId)
  }

  function clearRecommendations() {
    recommendations.value = []
    recommendNextIds.value = []
  }

  return {
    artworkCache,
    pagesCache,
    recommendations,
    recommendNextIds,
    getCachedArtwork,
    getCachedPages,
    fetchArtwork,
    fetchArtworkPages,
    fetchRecommendInit,
    fetchRecommendMore,
    addBookmark,
    removeBookmark,
    clearRecommendations,
  }
})
