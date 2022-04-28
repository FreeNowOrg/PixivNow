import { postJSON } from './fetch'

export async function addFollow(user_id: number): Promise<any> {
  return postJSON('/bookmark_add.php', {
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

export async function removeFollow(user_id: number): Promise<any> {
  return postJSON('/rpc_group_setting.php', {
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
