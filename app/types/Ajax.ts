export interface AjaxResponse<T extends {}> {
  error: boolean
  message: string
  body: T
}
