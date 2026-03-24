import type { ArtworkInfo, ArtworkInfoOrAd } from '~/types'

export function sortArtList<T extends { id: number | `${number}` }>(
  obj: Record<string, T>
): T[] {
  return Object.values(obj).sort((a, b) => +b.id - +a.id)
}

export function isArtwork(item: ArtworkInfoOrAd): item is ArtworkInfo {
  return Object.keys(item).includes('id')
}

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
