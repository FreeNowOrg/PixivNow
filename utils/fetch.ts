import type { AjaxResponse } from '~/types'

export async function useAjaxResponse<T>(url: string, opts?: any) {
  return (await $fetch<AjaxResponse<T>>(url, opts)).body
}
