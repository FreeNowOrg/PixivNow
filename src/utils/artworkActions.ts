import { API_BASE } from '../config'
import { postJSON } from './fetch'

export function sortArtList<T>(
  obj: Record<string, T & { id: number | `${number}` }>
): T[] {
  return Object.values(obj).sort((a, b) => +b.id - +a.id)
}

export async function addBookmark(
  illust_id: number | `${number}`
): Promise<any> {
  return postJSON(`${API_BASE}/ajax/illusts/bookmarks/add`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      illust_id,
      restrict: 0,
      comment: '',
      tags: [],
    }),
  })
}

export async function removeBookmark(
  bookmark_id: number | `${number}`
): Promise<any> {
  return postJSON(`${API_BASE}/rpc/index.php`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'delete_illust_bookmark',
      bookmark_id,
    }),
  })
}
