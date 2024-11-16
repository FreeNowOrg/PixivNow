export interface AjaxResponse<T = unknown> {
  error: boolean
  body: T
}
