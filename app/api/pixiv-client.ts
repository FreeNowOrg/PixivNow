import axios, { type AxiosInstance } from 'axios'
import nprogress from 'nprogress'
import { getToken, getCsrfToken } from '~/composables/userData'
import { createPximgReplacer } from '~/utils/pximg'
import type {
  Artwork,
  ArtworkGallery,
  ArtworkInfo,
  ArtworkInfoOrAd,
  ArtworkRank,
  RankedArtworkInfo,
  Comments,
  Novel,
  NovelInfo,
  NovelContentTitle,
  NovelSeries,
  NovelSeriesContentResult,
  NovelRankItem,
  RankedNovelInfo,
  User,
  UserListItem,
  PixivUser,
} from '~/types'

// ── Response envelope ────────────────────────────────────────────────

interface PixivResponse<T> {
  error: boolean
  message: string
  body: T
}

export interface PixivWebClientOptions {
  /** Base URL for API requests (default: current origin) */
  baseURL?: string
  /** Proxy base URL for i.pximg.net images (default: VITE_PXIMG_BASEURL_I or https://i.pximg.net/) */
  pximgBaseUrlI?: string
  /** Proxy base URL for s.pximg.net static assets (default: VITE_PXIMG_BASEURL_S or https://s.pximg.net/) */
  pximgBaseUrlS?: string
  /** Request timeout in ms (default: 15000) */
  timeout?: number
}

export interface UgoiraMeta {
  src: string
  originalSrc: string
  mime_type: string
  frames: { file: string; delay: number }[]
}

export interface RecommendResult {
  illusts: ArtworkInfo[]
  nextIds: string[]
}

export interface FollowingResult {
  total: number
  users: UserListItem[]
  extraData: {
    meta: {
      ogp: { title: string; image: string; description: string }
    }
  }
}

// ── PixivWebClient ───────────────────────────────────────────────────

function resolveBaseUrl(fallback: string, override?: string): string {
  if (override) return override.endsWith('/') ? override : override + '/'
  return fallback
}

export class PixivWebClient {
  private http: AxiosInstance
  private pximgReplacer: ReturnType<typeof createPximgReplacer>

  constructor(options: PixivWebClientOptions = {}) {
    let defaultI = '/-/'
    let defaultS = '/~/'
    try {
      const config = useRuntimeConfig()
      defaultI = (config.public.pximgBaseUrlI as string) || defaultI
      defaultS = (config.public.pximgBaseUrlS as string) || defaultS
    } catch {
      // runtimeConfig not available
    }
    const baseUrlI = resolveBaseUrl(defaultI, options.pximgBaseUrlI)
    const baseUrlS = resolveBaseUrl(defaultS, options.pximgBaseUrlS)
    this.pximgReplacer = createPximgReplacer(baseUrlI, baseUrlS)

    this.http = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 15 * 1000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.http.interceptors.request.use((config) => {
      nprogress.start()

      config.headers = config.headers || {}

      const token = getToken()
      if (token) {
        config.headers['Authorization'] = token
      }

      const csrfToken = getCsrfToken()
      if (csrfToken && config.method?.toLowerCase() === 'post') {
        config.headers['X-CSRF-TOKEN'] = csrfToken
      }

      return config
    })

    this.http.interceptors.response.use(
      (res) => {
        nprogress.done()
        return res
      },
      (err) => {
        nprogress.done()
        return Promise.reject(err)
      }
    )
  }

  // ── Internal helpers ──────────────────────────────────────────────

  /**
   * Unwrap /ajax/* response envelope and apply pximg URL replacement.
   */
  private unwrap<T>(data: PixivResponse<T>): T {
    if (data.error) {
      throw new Error(data.message || 'Pixiv API error')
    }
    return this.pximgReplacer.replacePximgInObject(data.body)
  }

  /**
   * Apply pximg URL replacement without unwrapping (for non-ajax endpoints).
   */
  private transform<T>(data: T): T {
    return this.pximgReplacer.replacePximgInObject(data)
  }

  private async postFormData(
    url: string,
    data:
      | string
      | string[][]
      | Record<string, string>
      | URLSearchParams
      | undefined
  ) {
    return this.http.post(url, new URLSearchParams(data).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
    })
  }

  // ── Artwork ───────────────────────────────────────────────────────

  async getArtwork(id: string): Promise<Artwork> {
    const { data } = await this.http.get<PixivResponse<Artwork>>(
      `/ajax/illust/${id}?full=1`
    )
    return this.unwrap(data)
  }

  async getArtworkPages(id: string): Promise<ArtworkGallery[]> {
    const { data } = await this.http.get<PixivResponse<ArtworkGallery[]>>(
      `/ajax/illust/${id}/pages`
    )
    return this.unwrap(data)
  }

  // ── Novel ─────────────────────────────────────────────────────────

  async getNovel(id: string): Promise<Novel> {
    const { data } = await this.http.get<PixivResponse<Novel>>(
      `/ajax/novel/${id}`
    )
    return this.unwrap(data)
  }

  async getNovelSeries(id: string): Promise<NovelSeries> {
    const { data } = await this.http.get<PixivResponse<NovelSeries>>(
      `/ajax/novel/series/${id}`
    )
    return this.unwrap(data)
  }

  async getNovelSeriesContent(
    id: string,
    params?: { limit?: number; lastOrder?: number; orderBy?: 'asc' | 'dsc' }
  ): Promise<NovelSeriesContentResult> {
    const { data } = await this.http.get<
      PixivResponse<NovelSeriesContentResult>
    >(`/ajax/novel/series_content/${id}`, {
      params: {
        limit: params?.limit ?? 30,
        last_order: params?.lastOrder ?? 0,
        order_by: params?.orderBy ?? 'asc',
      },
    })
    return this.unwrap(data)
  }

  async getNovelSeriesContentTitles(
    id: string
  ): Promise<NovelContentTitle[]> {
    const { data } = await this.http.get<PixivResponse<NovelContentTitle[]>>(
      `/ajax/novel/series/${id}/content_titles`
    )
    return this.unwrap(data)
  }

  async getUgoiraMeta(id: string): Promise<UgoiraMeta> {
    const { data } = await this.http.get<PixivResponse<UgoiraMeta>>(
      `/ajax/illust/${id}/ugoira_meta`
    )
    return this.unwrap(data)
  }

  // ── Discovery & Recommendations ───────────────────────────────────

  async getDiscovery(params: {
    mode?: string
    limit?: number
  }): Promise<ArtworkInfo[]> {
    const hasAuth = !!getToken()
    if (hasAuth) {
      const { data } = await this.http.get<
        PixivResponse<{ thumbnails: { illust: ArtworkInfoOrAd[] } }>
      >('/ajax/discovery/artworks', {
        params: {
          mode: params.mode ?? 'all',
          limit: String(params.limit ?? 60),
        },
      })
      const body = this.unwrap(data)
      return body.thumbnails.illust.filter((item): item is ArtworkInfo => 'id' in item)
    } else {
      const { data } = await this.http.get<
        PixivResponse<{ illusts: ArtworkInfoOrAd[] }>
      >('/ajax/illust/discovery', {
        params: {
          mode: params.mode ?? 'safe',
          max: String(Math.min(params.limit ?? 18, 18)),
        },
      })
      const body = this.unwrap(data)
      return body.illusts.filter((item): item is ArtworkInfo => 'id' in item)
    }
  }

  async getNovelDiscovery(params: {
    mode?: string
    limit?: number
  }): Promise<NovelInfo[]> {
    const { data } = await this.http.get<
      PixivResponse<{ novels: NovelInfo[] }>
    >('/ajax/novel/discovery', {
      params: {
        mode: params.mode ?? 'safe',
        limit: params.limit,
      },
    })
    return this.unwrap(data).novels ?? []
  }

  async getRecommendInit(
    id: string,
    limit: number = 18
  ): Promise<RecommendResult> {
    const { data } = await this.http.get<PixivResponse<RecommendResult>>(
      `/ajax/illust/${id}/recommend/init`,
      { params: { limit } }
    )
    return this.unwrap(data)
  }

  async getRecommendMore(ids: string[]): Promise<RecommendResult> {
    const searchParams = new URLSearchParams()
    for (const id of ids) {
      searchParams.append('illust_ids[]', id)
    }
    const { data } = await this.http.get<PixivResponse<RecommendResult>>(
      '/ajax/illust/recommend/illusts',
      { params: searchParams }
    )
    return this.unwrap(data)
  }

  // ── Search ────────────────────────────────────────────────────────

  async searchArtworks(
    keyword: string,
    params?: { p?: number; mode?: string }
  ): Promise<{ data: ArtworkInfo[]; total: number }> {
    const { data } = await this.http.get<
      PixivResponse<{
        illustManga: { data: ArtworkInfo[]; total: number }
      }>
    >(`/ajax/search/artworks/${encodeURIComponent(keyword)}`, {
      params: { p: params?.p ?? 1, mode: params?.mode ?? 'text' },
    })
    const body = this.unwrap(data)
    return {
      data: body.illustManga?.data ?? [],
      total: body.illustManga?.total ?? 0,
    }
  }

  async searchNovels(
    keyword: string,
    params?: { p?: number; mode?: string }
  ): Promise<{ data: NovelInfo[]; total: number }> {
    const { data } = await this.http.get<
      PixivResponse<{
        novel: { data: NovelInfo[]; total: number }
      }>
    >(`/ajax/search/novels/${encodeURIComponent(keyword)}`, {
      params: { p: params?.p ?? 1, mode: params?.mode },
    })
    const body = this.unwrap(data)
    return {
      data: body.novel?.data ?? [],
      total: body.novel?.total ?? 0,
    }
  }

  // ── Ranking ───────────────────────────────────────────────────────

  async getRanking(params?: {
    p?: number
    mode?: string
    date?: string
    content?: string
  }): Promise<{ date: string; contents: RankedArtworkInfo[] }> {
    const searchParams = new URLSearchParams({ format: 'json' })
    if (params?.p) searchParams.set('p', String(params.p))
    if (params?.mode) searchParams.set('mode', params.mode)
    if (params?.date) searchParams.set('date', params.date)
    if (params?.content) searchParams.set('content', params.content)
    const { data } = await this.http.get<{
      date: string
      contents: ArtworkRank[]
    }>('/ranking.php', { params: searchParams })
    const transformed = this.transform(data)
    return {
      date: transformed.date,
      contents: transformed.contents.map(
        (item): RankedArtworkInfo => ({
          id: `${item.illust_id}`,
          title: item.title,
          description: '',
          createDate: item.date,
          updateDate: item.date,
          illustType: +item.illust_type as 0 | 1 | 2,
          restrict: 0,
          xRestrict: item.illust_content_type.sexual,
          sl: 0,
          userId: `${item.user_id}`,
          userName: item.user_name,
          alt: item.title,
          width: item.width,
          height: item.height,
          pageCount: +item.illust_page_count,
          isBookmarkable: true,
          bookmarkData: null,
          titleCaptionTranslation: {
            workTitle: null,
            workCaption: null,
          },
          isUnlisted: false,
          aiType: 0,
          url: item.url,
          tags: item.tags,
          profileImageUrl: item.profile_img,
          type: 'illust',
          rank: item.rank,
          viewCount: item.view_count,
        })
      ),
    }
  }

  async getNovelRanking(params?: {
    p?: number
    mode?: string
  }): Promise<{ date: string; contents: RankedNovelInfo[] }> {
    const { data } = await this.http.get<
      PixivResponse<{
        display_a: { rank_a: NovelRankItem[] }
        date: string
      }>
    >('/ajax/ranking/novel', {
      params: { mode: params?.mode ?? 'daily', p: params?.p },
    })
    const body = this.unwrap(data)
    return {
      date: body.date,
      contents: (body.display_a?.rank_a ?? []).map(
        (item): RankedNovelInfo => ({
          id: `${item.id}`,
          title: item.title,
          description: item.comment ?? '',
          createDate: item.create_date ?? '',
          updateDate: item.create_date ?? '',
          restrict: item.restrict as 0,
          xRestrict: item.x_restrict as 0 | 1 | 2,
          userId: `${item.user_id}`,
          userName: item.user_name,
          isBookmarkable: true,
          bookmarkData: null,
          titleCaptionTranslation: {
            workTitle: null,
            workCaption: null,
          },
          isUnlisted: false,
          aiType: item.ai_type,
          url: item.url,
          tags: item.tag_a ?? [],
          profileImageUrl: item.profile_img,
          type: 'novel',
          genre: item.genre,
          textCount: item.character_count,
          wordCount: item.word_count,
          readingTime: item.reading_time,
          isOriginal: item.is_original,
          bookmarkCount: item.bookmark_count,
          language: item.language,
          marker: item.marker,
          rank: item.rank,
        })
      ),
    }
  }

  // ── User ──────────────────────────────────────────────────────────

  async getUser(id: string): Promise<User> {
    const { data } = await this.http.get<PixivResponse<User>>(
      `/ajax/user/${id}?full=1`
    )
    return this.unwrap(data)
  }

  async getUserProfileTop(id: string): Promise<{
    illusts: Record<string, ArtworkInfo>
    manga: Record<string, ArtworkInfo>
    novels: Record<string, NovelInfo>
  }> {
    const { data } = await this.http.get<
      PixivResponse<{
        illusts: Record<string, ArtworkInfo>
        manga: Record<string, ArtworkInfo>
        novels: Record<string, NovelInfo>
      }>
    >(`/ajax/user/${id}/profile/top`)
    return this.unwrap(data)
  }

  async getUserProfileAll(id: string): Promise<{
    illusts: Record<string, null>
    manga: Record<string, null>
  }> {
    const { data } = await this.http.get<
      PixivResponse<{
        illusts: Record<string, null>
        manga: Record<string, null>
      }>
    >(`/ajax/user/${id}/profile/all`)
    return this.unwrap(data)
  }

  async getUserIllusts(
    userId: string,
    ids: string[],
    workCategory: string
  ): Promise<Record<string, ArtworkInfo>> {
    const { data } = await this.http.get<
      PixivResponse<{ works: Record<string, ArtworkInfo> }>
    >(`/ajax/user/${userId}/profile/illusts`, {
      params: { ids, work_category: workCategory, is_first_page: 0 },
    })
    return this.unwrap(data).works
  }

  // ── Following & Feed ──────────────────────────────────────────────

  async getUserFollowing(
    userId: string,
    params: { offset: number; limit: number; rest: string }
  ): Promise<FollowingResult> {
    const { data } = await this.http.get<PixivResponse<FollowingResult>>(
      `/ajax/user/${userId}/following`,
      { params }
    )
    return this.unwrap(data)
  }

  async getFollowLatest(params: { p: number; mode: string }): Promise<{
    page: { isLastPage: boolean }
    thumbnails: { illust: ArtworkInfo[] }
  }> {
    const { data } = await this.http.get<
      PixivResponse<{
        page: { isLastPage: boolean }
        thumbnails: { illust: ArtworkInfo[] }
      }>
    >('/ajax/follow_latest/illust', { params })
    return this.unwrap(data)
  }

  // ── Bookmarks ─────────────────────────────────────────────────────

  async getUserBookmarks(
    userId: string,
    params: { tag: string; offset: number; limit: number; rest: string }
  ): Promise<{ works: ArtworkInfo[]; total: number }> {
    const { data } = await this.http.get<
      PixivResponse<{ works: ArtworkInfo[]; total: number }>
    >(`/ajax/user/${userId}/illusts/bookmarks`, { params })
    return this.unwrap(data)
  }

  async addBookmark(illustId: string | number): Promise<any> {
    const { data } = await this.http.post<PixivResponse<any>>(
      '/ajax/illusts/bookmarks/add',
      { illust_id: illustId, restrict: 0, comment: '', tags: [] }
    )
    return this.unwrap(data)
  }

  async removeBookmark(bookmarkId: string | number): Promise<any> {
    const { data } = await this.postFormData('/ajax/illusts/bookmarks/delete', {
      bookmark_id: '' + bookmarkId,
    })
    return data
  }

  // ── Comments ──────────────────────────────────────────────────────

  async getComments(
    illustId: string,
    params: { limit: number; offset: number }
  ): Promise<{ hasNext: boolean; comments: Comments[] }> {
    const { data } = await this.http.get<
      PixivResponse<{ hasNext: boolean; comments: Comments[] }>
    >('/ajax/illusts/comments/roots', {
      params: {
        illust_id: illustId,
        limit: String(params.limit),
        offset: String(params.offset),
      },
    })
    return this.unwrap(data)
  }

  async postComment(params: {
    illustId: string | number
    authorUserId: string | number
    comment: string
  }): Promise<any> {
    const { data } = await this.http.post<PixivResponse<any>>(
      '/ajax/illusts/comments/post',
      {
        type: 'comment',
        illust_id: params.illustId,
        author_user_id: params.authorUserId,
        comment: params.comment,
      }
    )
    return this.unwrap(data)
  }

  // ── User Follow / Unfollow ────────────────────────────────────────

  async followUser(userId: string | number): Promise<any> {
    const { data } = await this.postFormData('/bookmark_add.php', {
      mode: 'add',
      type: 'user',
      user_id: '' + userId,
      tag: '',
      restrict: '0',
      format: 'json',
    })
    return data
  }

  async unfollowUser(userId: string | number): Promise<any> {
    const { data } = await this.postFormData('/rpc_group_setting.php', {
      mode: 'del',
      type: 'bookuser',
      id: '' + userId,
    })
    return data
  }

  // ── Custom Endpoints ──────────────────────────────────────────────

  async _getSessionUser(): Promise<{
    userData: PixivUser
    token: string
  }> {
    const { data } = await this.http.get<{
      userData: PixivUser
      token: string
    }>('/api/user', { headers: { 'Cache-Control': 'no-store' } })
    return this.transform(data)
  }
}
