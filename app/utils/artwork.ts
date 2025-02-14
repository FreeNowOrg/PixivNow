import type { ArtworkInfo, ArtworkInfoOrAd, NumberLike } from '../types'

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

export function sortArtList<T extends { id: NumberLike }>(
  obj: Record<string, T>
): T[] {
  return Object.values(obj).sort((a, b) => +b.id - +a.id)
}

export function isArtwork(item: ArtworkInfoOrAd): item is ArtworkInfo {
  return Object.keys(item).includes('id')
}

export async function addBookmark(illust_id: NumberLike): Promise<any> {
  return (
    await useAjaxResponse<any>('/ajax/illusts/bookmarks/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { illust_id, restrict: 0, comment: '', tags: [] },
    })
  ).data
}

export async function removeBookmark(bookmark_id: NumberLike): Promise<any> {
  return (
    await useAjaxResponse<any>('/ajax/illusts/bookmarks/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: {
        bookmark_id: '' + bookmark_id,
      },
    })
  ).data
}
