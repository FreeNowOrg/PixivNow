import { defineStore } from 'pinia'
import type {
  Novel,
  NovelContentTitle,
  NovelInfo,
  NovelSeries,
  NovelSeriesContentItem,
} from '~/types'

export const useNovelStore = defineStore('novel', () => {
  const pixivClient = usePixivClient()
  const novelCache = ref(new Map<string, Novel>())
  const seriesCache = ref(new Map<string, NovelSeries>())
  const seriesContentCache = ref(new Map<string, NovelInfo[]>())
  const seriesTitleCache = ref(new Map<string, NovelContentTitle[]>())

  const recommendations = ref<NovelInfo[]>([])
  const recommendNextIds = ref<string[]>([])

  function normalizeSeriesContent(item: NovelSeriesContentItem): NovelInfo {
    const date = item.updateDate || item.createDate || ''
    return {
      id: (`${item.id}` as `${number}`),
      title: item.title,
      description: '',
      createDate: date,
      updateDate: date,
      restrict: 0,
      xRestrict: item.xRestrict ?? 0,
      userId: `${item.userId || ''}` as `${number}`,
      userName: item.userName || '',
      isBookmarkable: true,
      bookmarkData: item.bookmarkData
        ? {
            ...item.bookmarkData,
            id: `${item.bookmarkData.id}` as `${number}`,
          }
        : null,
      titleCaptionTranslation: { workTitle: null, workCaption: null },
      isUnlisted: false,
      aiType: item.aiType ?? 0,
      url: item.url || item.coverUrl || '',
      tags: item.tags || [],
      profileImageUrl: '',
      type: 'novel',
      bookmarkCount: item.bookmarkCount,
      textCount: item.textCount || item.textLength || item.characterCount,
      wordCount: item.wordCount,
      readingTime: item.readingTime,
    }
  }

  function getCachedNovel(id: string): Novel | undefined {
    return novelCache.value.get(id)
  }

  function getCachedSeries(id: string): NovelSeries | undefined {
    return seriesCache.value.get(id)
  }

  async function fetchNovel(id: string): Promise<Novel> {
    const cached = novelCache.value.get(id)
    if (cached) return cached

    const novel = await pixivClient.getNovel(id)
    novelCache.value.set(id, novel)
    return novel
  }

  async function fetchNovelSeries(id: string): Promise<NovelSeries> {
    const cached = seriesCache.value.get(id)
    if (cached) return cached

    const series = await pixivClient.getNovelSeries(id)
    seriesCache.value.set(id, series)
    return series
  }

  async function fetchNovelSeriesContent(id: string): Promise<NovelInfo[]> {
    const cached = seriesContentCache.value.get(id)
    if (cached) return cached

    const result = await pixivClient.getNovelSeriesContent(id)
    const novels = result.thumbnails?.novel?.length
      ? result.thumbnails.novel
      : (result.page?.seriesContents || []).map(normalizeSeriesContent)
    seriesContentCache.value.set(id, novels)
    return novels
  }

  async function fetchNovelSeriesContentTitles(
    id: string
  ): Promise<NovelContentTitle[]> {
    const cached = seriesTitleCache.value.get(id)
    if (cached) return cached

    const titles = await pixivClient.getNovelSeriesContentTitles(id)
    seriesTitleCache.value.set(id, titles)
    return titles
  }

  async function fetchComments(
    id: string,
    params: { limit: number; offset: number }
  ) {
    return pixivClient.getNovelComments(id, params)
  }

  async function fetchRecommendInit(
    id: string
  ): Promise<{ novels: NovelInfo[]; nextIds: string[] }> {
    const result = await pixivClient.getNovelRecommendInit(id, 18)
    recommendations.value = result.novels
    recommendNextIds.value = result.nextIds
    return result
  }

  async function fetchRecommendMore(): Promise<void> {
    if (!recommendNextIds.value.length) return
    const ids = recommendNextIds.value.splice(0, 18)
    const result = await pixivClient.getNovelRecommendMore(ids)
    recommendations.value = recommendations.value.concat(result.novels)
  }

  function clearRecommendations() {
    recommendations.value = []
    recommendNextIds.value = []
  }

  return {
    novelCache,
    seriesCache,
    seriesContentCache,
    seriesTitleCache,
    recommendations,
    recommendNextIds,
    getCachedNovel,
    getCachedSeries,
    fetchNovel,
    fetchNovelSeries,
    fetchNovelSeriesContent,
    fetchNovelSeriesContentTitles,
    fetchComments,
    fetchRecommendInit,
    fetchRecommendMore,
    clearRecommendations,
  }
})
