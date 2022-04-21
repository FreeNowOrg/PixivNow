export async function fetchJSON(
  input: RequestInfo,
  init?: RequestInit
): Promise<any> {
  const response = await fetch(input, init)
  return response.json()
}

export async function postJSON(input: RequestInfo, init?: RequestInit) {
  if (!init) init = {}
  init.method = 'POST'
  const response = await fetch(input, init)
  return response.json()
}
