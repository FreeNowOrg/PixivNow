import axios from 'axios'

export function addBookmark(illust_id: number) {
  return axios({
    method: 'post',
    url: `/ajax/illusts/bookmarks/add`,
    data: {
      illust_id,
      restrict: 0,
      comment: '',
      tags: [],
    },
  })
}

export function removeBookmark(bookmark_id: number) {
  return axios({
    method: 'post',
    url: `/rpc/index.php`,
    data: {
      mode: 'delete_illust_bookmark',
      bookmark_id,
    },
  })
}
