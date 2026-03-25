import axios, { type AxiosInstance } from 'axios'
import Cookies from 'js-cookie'
import nprogress from 'nprogress'
import { createPximgReplacer } from '~/utils/pximg'
import type {
  Artwork,
  ArtworkGallery,
  ArtworkInfo,
  ArtworkInfoOrAd,
  ArtworkRank,
  Comments,
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

      // Attach CSRF token for POST requests
      const csrfToken = Cookies.get('CSRFTOKEN')
      if (csrfToken && config.method?.toLowerCase() === 'post') {
        config.headers = config.headers || {}
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

  async getUgoiraMeta(id: string): Promise<UgoiraMeta> {
    const { data } = await this.http.get<PixivResponse<UgoiraMeta>>(
      `/ajax/illust/${id}/ugoira_meta`
    )
    return this.unwrap(data)
  }

  // ── Discovery & Recommendations ───────────────────────────────────

  async getDiscovery(params: {
    mode?: string
    max?: number
  }): Promise<ArtworkInfo[]> {
    const { data } = await this.http.get<
      PixivResponse<{ illusts: ArtworkInfoOrAd[] }>
    >('/ajax/illust/discovery', {
      params: {
        mode: params.mode ?? 'all',
        max: String(params.max ?? 18),
      },
    })
    const body = this.unwrap(data)
    return body.illusts.filter((item): item is ArtworkInfo => 'id' in item)
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
      searchParams.append('illust_ids', id)
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

  // ── Ranking ───────────────────────────────────────────────────────

  async getRanking(params?: {
    p?: number
    mode?: string
    date?: string
    content?: string
  }): Promise<{ date: string; contents: ArtworkRank[] }> {
    const searchParams = new URLSearchParams({ format: 'json' })
    if (params?.p) searchParams.set('p', String(params.p))
    if (params?.mode) searchParams.set('mode', params.mode)
    if (params?.date) searchParams.set('date', params.date)
    if (params?.content) searchParams.set('content', params.content)
    // ranking.php returns data directly (no body envelope)
    const { data } = await this.http.get<{
      date: string
      contents: ArtworkRank[]
    }>('/ranking.php', { params: searchParams })
    return this.transform(data)
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
    novels: Record<string, ArtworkInfo>
  }> {
    const { data } = await this.http.get<
      PixivResponse<{
        illusts: Record<string, ArtworkInfo>
        manga: Record<string, ArtworkInfo>
        novels: Record<string, ArtworkInfo>
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
