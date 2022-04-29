export async function getJSON<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init)
  return response.json()
}

export async function postJSON<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  if (!init) init = {}
  init.method = 'POST'
  const response = await fetch(input, init)
  return response.json()
}
