import { ArtworkInfo, ArtworkInfoOrAd } from '@/types'

export function sortArtList<T extends { id: number | `${number}` }>(
  obj: Record<string, T>
): T[] {
  return Object.values(obj).sort((a, b) => +b.id - +a.id)
}

export function isArtwork(item: ArtworkInfoOrAd): item is ArtworkInfo {
  return Object.keys(item).includes('id')
}

export async function addBookmark(
  illust_id: number | `${number}`
): Promise<any> {
  return (
    await axios.post('/ajax/illusts/bookmarks/add', {
      illust_id,
      restrict: 0,
      comment: '',
      tags: [],
    })
  ).data
}

export async function removeBookmark(
  bookmark_id: number | `${number}`
): Promise<any> {
  return (
    await axios.post('/rpc/index.php', {
      mode: 'delete_illust_bookmark',
      bookmark_id,
    })
  ).data
}
