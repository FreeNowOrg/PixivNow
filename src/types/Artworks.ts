export interface ArtworkUrls {
  mini: string
  thumb: string
  small: string
  regular: string
  original: string
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

interface ArtworkCommon {
  id: `${number}`
  title: string
  description: string
  createDate: string
  updateDate: string
  illustType: 0
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
}

export interface ArtworkReduced extends ArtworkCommon {
  url: string
  tags: string[]
  profileImageUrl: string
  type: 'illust' | 'novel'
}

export type ArtworkReducedOrAd =
  | ArtworkReduced
  | {
      isAdContainer: true
    }

export interface ArtworkRank {
  title: string
  date: string
  tags: string[]
  url: string
  illustType: '0' | '1' | '2'
  illustBookStyle: '0'
  illustPageCount: `${number}`
  userName: string
  profileImg: string
  illustContentType: Record<string, boolean | 0>
  illustSeries:
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
  illustId: number
  width: number
  height: number
  userId: number
  rank: number
  yesRank: number
  ratingCount: number
  viewCount: number
  illustUploadTimestamp: number
  attr: string
  xRestrict: 0 | 1 | 2
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
  userIllusts: Record<`${number}`, ArtworkReduced | null>
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
    zengoIdWorks: ArtworkReduced[]
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
  pages: {
    width: number
    height: number
    urls: {
      original: string
      small: string
      regular: string
      thumb_mini: string
    }
  }[]
}
