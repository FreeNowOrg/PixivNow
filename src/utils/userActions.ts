export async function addFollow(user_id: number | `${number}`): Promise<any> {
  return (
    await axios.post(`/bookmark_add.php`, {
      mode: 'add',
      type: 'user',
      user_id,
      tag: '',
      restrict: 0,
      format: 'json',
    })
  ).data
}

export async function removeFollow(
  user_id: number | `${number}`
): Promise<any> {
  return (
    await axios.post(`/rpc_group_setting.php`, {
      mode: 'del',
      type: 'bookuser',
      id: user_id,
    })
  ).data
}
