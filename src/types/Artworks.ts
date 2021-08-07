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
export interface Artwork {
  illustId?: `${number}`
  illustTitle?: string
  illustComment?: string
  id: `${number}`
  title: string
  illustType: 0
  xRestrict: 0 | 1 | 2
  restrict: 0
  sl: 2
  url: string
  urls?: ArtworkUrls
  pages?: { urls: ArtworkUrls; width: number; height: number }[]
  description: string
  tags:
    | {
        authorId: `${number}`
        isLocked: boolean
        tags: ArtworkTag[]
      }
    | string[]
  storableTags?: string[]
  userId: `${number}`
  userName: string
  userAccount?: string
  userIllusts: Record<string, Artwork | null>
  likeData: boolean
  width: number
  height: number
  pageCount: number
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
  isBookmarkable: boolean
  contestData: any
  bookmarkData?: {
    id: `${number}`
    private: boolean
  } | null
  alt: string
  titleCaptionTranslation: {
    workTitle: string
    workCaption: string
  }
  createDate: string
  updateDate: string
  isUnlisted: boolean
  isMasked: boolean
  profileImageUrl: string
  type: 'illust' | 'novel'
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
    zengoIdWorks: Artwork[]
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
}
