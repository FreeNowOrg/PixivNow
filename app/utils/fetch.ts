import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack/types'

export async function useAjaxResponse<T extends {}>(
  url: string,
  opts?: NitroFetchOptions<NitroFetchRequest>
) {
  return (await $fetch<AjaxResponse<T>>(url, opts)).body
}
