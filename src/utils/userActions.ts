import { ajaxPostWithFormData } from '@/utils/ajax'

export async function addUserFollow(
  user_id: number | `${number}`
): Promise<any> {
  return (
    await ajaxPostWithFormData(`/bookmark_add.php`, {
      mode: 'add',
      type: 'user',
      user_id: '' + user_id,
      tag: '',
      restrict: '0',
      format: 'json',
    })
  ).data
}

export async function removeUserFollow(
  user_id: number | `${number}`
): Promise<any> {
  return (
    await ajaxPostWithFormData(`/rpc_group_setting.php`, {
      mode: 'del',
      type: 'bookuser',
      id: '' + user_id,
    })
  ).data
}
