import axios from 'axios'

export function addFollow(user_id: number) {
  return axios({
    method: 'post',
    url: '/bookmark_add.php',
    data: {
      mode: 'add',
      type: 'user',
      user_id,
      tag: '',
      restrict: 0,
      format: 'json',
    },
  })
}

export function removeFollow(user_id: number) {
  return axios({
    method: 'post',
    url: '/rpc_group_setting.php',
    data: {
      mode: 'del',
      type: 'bookuser',
      id: user_id,
    },
  })
}
