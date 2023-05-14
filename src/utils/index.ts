import { ArtworkInfo } from '@/types'

export * from './artworkActions'
export * from './userActions'

export const defaultArtwork: ArtworkInfo = {
  id: '0',
  title: '',
  description: '',
  createDate: '',
  updateDate: '',
  illustType: 0,
  restrict: 0,
  xRestrict: 0,
  sl: 0,
  userId: '0',
  userName: '',
  alt: '',
  width: 0,
  height: 0,
  pageCount: 0,
  isBookmarkable: false,
  bookmarkData: null,
  titleCaptionTranslation: {
    workTitle: null,
    workCaption: null,
  },
  isUnlisted: false,
  url: '',
  tags: [],
  profileImageUrl: '',
  type: 'illust',
  aiType: 1,
}
