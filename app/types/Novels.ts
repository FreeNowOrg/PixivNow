import type { ArtworkInfo } from './Artworks'

export interface NovelTag {
  tag: string
  locked?: boolean
  deletable?: boolean
  userId?: string
  userName?: string
  translation?: {
    en?: string
  }
}

export interface NovelInfo
  extends Omit<
    ArtworkInfo,
    'illustType' | 'sl' | 'alt' | 'width' | 'height' | 'pageCount' | 'type'
  > {
  type?: 'novel'
  genre?: string
  textCount?: number
  wordCount?: number
  readingTime?: number
  useWordCount?: boolean
  isOriginal?: boolean
  marker?: unknown
  language?: string
  pageCount?: number
  bookmarkCount?: number | null
}

export type RankedNovelInfo = NovelInfo & {
  rank: number
}

export interface NovelRankItem {
  id: number
  title: string
  rank: number
  user_id: number
  user_name: string
  profile_img: string
  url: string
  bookmark_count: number
  character_count: number
  word_count: number
  reading_time: number
  genre: string
  is_original: boolean
  language: string
  series_id: string
  series_title: string
  tag_a: string[]
  ai_type: number
  x_restrict: number
  restrict: number
  create_date: string
  comment: string
  marker: unknown
}

export interface NovelTextEmbeddedImage {
  urls?: Record<string, string>
  width?: number
  height?: number
  alt?: string
}

export interface Novel {
  id: string
  title: string
  description: string
  content: string
  coverUrl?: string
  userId: string
  userName: string
  profileImageUrl?: string
  createDate: string
  uploadDate?: string
  updateDate?: string
  bookmarkCount: number | null
  likeCount: number
  viewCount: number
  commentCount: number
  commentOff?: 0 | 1
  markerCount?: number
  pageCount: number
  characterCount?: number
  textCount?: number
  wordCount?: number
  readingTime?: number
  useWordCount?: boolean
  genre?: string
  language?: string
  xRestrict: 0 | 1 | 2
  restrict: number
  isOriginal: boolean
  isBungei?: boolean
  isBookmarkable: boolean
  bookmarkData: { id: string; private: boolean } | null
  likeData: boolean
  marker: unknown
  tags: {
    authorId: string
    isLocked: boolean
    tags: NovelTag[]
    writable: boolean
  }
  seriesNavData: NovelSeriesNavData | null
  userNovels?: Record<string, NovelInfo | null>
  textEmbeddedImages?: Record<string, NovelTextEmbeddedImage> | null
  extraData?: {
    meta?: {
      title?: string
      description?: string
      canonical?: string
      ogp?: Record<string, string>
      twitter?: Record<string, string>
    }
  }
  titleCaptionTranslation?: {
    workTitle: string | null
    workCaption: string | null
  }
  isUnlisted?: boolean
  aiType?: number
  isLoginOnly?: boolean
}

export interface NovelSeriesNavData {
  seriesId: string
  title: string
  order?: number
  isConcluded?: boolean
  isWatched?: boolean
  isNotifying?: boolean
  prev?: {
    id: string
    title: string
    order?: number
    available?: boolean
  }
  next?: {
    id: string
    title: string
    order?: number
    available?: boolean
  }
}

export interface NovelSeries {
  id: string
  userId: string
  userName: string
  profileImageUrl: string
  xRestrict: 0 | 1 | 2
  isOriginal: boolean
  isConcluded: boolean
  genreId: string
  title: string
  caption: string
  language: string
  tags: string[]
  publishedContentCount: number
  publishedTotalCharacterCount: number
  publishedTotalWordCount: number
  publishedReadingTime: number
  useWordCount: boolean
  createDate: string
  updateDate: string
  firstNovelId: string
  latestNovelId: string
  displaySeriesContentCount: number
  shareText: string
  total: number
  firstEpisode?: {
    url?: string
  }
  cover?: {
    urls: Record<string, string>
  }
  isWatched?: boolean
  isNotifying?: boolean
  aiType?: number
  hasGlossary?: boolean
  extraData?: {
    meta?: {
      title?: string
      description?: string
      canonical?: string
      ogp?: Record<string, string>
      twitter?: Record<string, string>
    }
  }
}

export interface NovelSeriesContentItem {
  id: string
  title: string
  url?: string
  coverUrl?: string
  tags?: string[]
  userId?: string
  userName?: string
  xRestrict?: 0 | 1 | 2
  aiType?: number
  bookmarkCount?: number | null
  bookmarkData?: { id: string; private: boolean } | null
  characterCount?: number
  textLength?: number
  textCount?: number
  wordCount?: number
  readingTime?: number
  createDate?: string
  updateDate?: string
  uploadTimestamp?: number
  reuploadTimestamp?: number
  series?: {
    id?: string
    title?: string
    order?: number
  }
}

export interface NovelSeriesContentResult {
  page?: {
    seriesContents?: NovelSeriesContentItem[]
  }
  thumbnails?: {
    novel?: NovelInfo[]
  }
}

export interface NovelContentTitle {
  id: string
  title: string
  available: boolean
}

export type NovelInlineToken =
  | { type: 'text'; text: string }
  | { type: 'ruby'; base: string; ruby: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'jump'; page: number }
  | { type: 'bold'; inlines: NovelInlineToken[] }
  | { type: 'italic'; inlines: NovelInlineToken[] }
  | { type: 'emphasis'; text: string; mark: string }

export type NovelContentBlock =
  | { type: 'paragraph'; inlines: NovelInlineToken[] }
  | { type: 'chapter'; title: string }
  | { type: 'divider'; label?: string }
  | { type: 'uploadedImage'; id: string; src: string; alt: string }
  | { type: 'pixivImage'; id: string }
