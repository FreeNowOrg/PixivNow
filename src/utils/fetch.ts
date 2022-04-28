export async function getJSON(
  input: RequestInfo,
  init?: RequestInit
): Promise<any> {
  const response = await fetch(input, init)
  return response.json()
}

export async function postJSON(
  input: RequestInfo,
  init?: RequestInit
): Promise<any> {
  if (!init) init = {}
  init.method = 'POST'
  const response = await fetch(input, init)
  return response.json()
}
