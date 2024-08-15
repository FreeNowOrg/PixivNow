export interface ArtworkUrls {
  mini: string
  thumb: string
  small: string
  regular: string
  original: string
}

export interface ArtworkPageUrls {
  original: string
  small: string
  regular: string
  thumb_mini: string
}

export interface ArtworkTag {
  tag: string
  locked: boolean
  deletable: boolean
  userId: `${number}`
  translation?: {
    en?: string
  }
  userName: string
}

export interface ArtworkGallery {
  urls: ArtworkPageUrls
  width: number
  height: number
}

interface ArtworkCommon {
  id: `${number}`
  title: string
  description: string
  createDate: string
  updateDate: string
  illustType: IllustType
  restrict: 0
  xRestrict: 0 | 1 | 2
  sl: number
  userId: `${number}`
  userName: string
  alt: string
  width: number
  height: number
  pageCount: number
  isBookmarkable: boolean
  bookmarkData: {
    id: `${number}`
    private: boolean
  } | null
  titleCaptionTranslation: {
    workTitle: string | null
    workCaption: string | null
  }
  isUnlisted: boolean
  aiType: number
}

export interface ArtworkInfo extends ArtworkCommon {
  url: string
  tags: string[]
  profileImageUrl: string
  type: 'illust' | 'novel'
}

export type ArtworkInfoOrAd =
  | ArtworkInfo
  | {
      isAdContainer: true
    }

export enum IllustType {
  ILLUST = 0,
  MANGA = 1,
  UGOIRA = 2,
}

export interface ArtworkRank {
  title: string
  date: string
  tags: string[]
  url: string
  illust_type: IllustType
  illust_book_style: '0'
  illust_page_count: `${number}`
  user_name: string
  profile_img: string
  illust_content_type: {
    sexual: 0 | 1 | 2
    lo: boolean
    grotesque: boolean
    violent: boolean
    homosexual: boolean
    drug: boolean
    thoughts: boolean
    antisocial: boolean
    religional: boolean
    original: boolean
    furry: boolean
    bl: boolean
    yuri: boolean
  }
  illust_series:
    | {
        illustSeriesId: `${number}`
        illustSeriesUserId: `${number}`
        illustSeriesTitle: string
        illustSeriesCaption: string
        illustSeriesContentCount: `${number}`
        illustSeriesCreateDatetime: string
        illustSeriesContentIllustId: `${number}`
        illustSeriesContentOrder: `${number}`
        pageUrl: string
      }
    | false
  illust_id: number
  width: number
  height: number
  user_id: number
  rank: number
  yes_rank: number
  rating_count: number
  view_count: number
  illust_upload_timestamp: number
  attr: string
}

export interface Artwork extends ArtworkCommon {
  illustId: `${number}`
  illustTitle: string
  illustComment: string
  urls: ArtworkUrls
  tags: {
    authorId: `${number}`
    isLocked: boolean
    tags: ArtworkTag[]
    writable: boolean
  }
  storableTags: string[]
  userAccount: string
  userIllusts: Record<`${number}`, ArtworkInfo | null>
  likeData: boolean
  bookmarkCount: number
  likeCount: number
  commentCount: number
  responseCount: number
  viewCount: number
  isHowto: boolean
  isOriginal: boolean
  imageResponseOutData: any[]
  imageResponseData: any[]
  imageResponseCount: number
  pollData: any
  seriesNavData: any
  descriptionBoothId: any
  descriptionYoutubeId: any
  comicPromotion: any
  fanboxPromotion: any
  contestBanners: any[]
  contestData: any
  profileImageUrl: string
  zoneConfig?: any
  extraData?: {
    meta: {
      title: string
      description: string
      canonical: string
      alternateLanguages: {
        ja: string
        en: string
      }
      descriptionHeader: string
      ogp: {
        description: string
        image: string
        title: string
        type: string
      }
      twitter: {
        description: string
        image: string
        title: string
        card: string
      }
    }
  }
  noLoginData?: {
    breadcrumbs: {
      successor: any[]
      current: {
        zh?: string
      }
    }
    zengoIdWorks: ArtworkInfo[]
    zengoWorkData: {
      nextWork: {
        id: `${number}`
        title: string
      }
      prevWork: {
        id: `${number}`
        title: string
      }
    }
  }
  pages: ArtworkGallery[]
}
