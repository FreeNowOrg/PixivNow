import { API_BASE } from '../config'
import { postJSON } from './fetch'

export async function addFollow(user_id: number | `${number}`): Promise<any> {
  return postJSON(`${API_BASE}/bookmark_add.php`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'add',
      type: 'user',
      user_id,
      tag: '',
      restrict: 0,
      format: 'json',
    }),
  })
}

export async function removeFollow(
  user_id: number | `${number}`
): Promise<any> {
  return postJSON(`${API_BASE}/rpc_group_setting.php`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'del',
      type: 'bookuser',
      id: user_id,
    }),
  })
}
