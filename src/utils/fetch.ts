import nProgress from 'nprogress'

export async function getJSON<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  nProgress.start()
  const response = await fetch(input, init)
  nProgress.done()
  return response.json()
}

export async function postJSON<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  if (!init) init = {}
  init.method = 'POST'
  nProgress.start()
  const response = await fetch(input, init)
  nProgress.done()
  return response.json()
}
