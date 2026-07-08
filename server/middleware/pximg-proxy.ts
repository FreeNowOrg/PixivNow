import { PROXY_USER_AGENT } from '~~/server/utils/pixiv'
import { proxyPass } from '~~/server/utils/proxy'

const PREFIX_MAP: Record<string, string> = {
  '-': 'https://i.pximg.net/',
  '~': 'https://s.pximg.net/',
}
const PROXY_REQUEST_HEADERS = [
  'accept',
  'accept-encoding',
  'accept-language',
  'cache-control',
  'if-modified-since',
  'if-none-match',
  'if-range',
  'range',
]
const PROXY_RESPONSE_HEADERS = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'expires',
  'last-modified',
]

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  const match = pathname.match(/^\/([-~])\/(.+)/)
  if (!match) return

  const [, prefix, path] = match
  const baseUrl = PREFIX_MAP[prefix!]
  if (!baseUrl) return

  const url = `${baseUrl}${path}`

  const reqHeaders = getHeaders(event)
  const headers: Record<string, string> = {}
  for (const h of PROXY_REQUEST_HEADERS) {
    if (typeof reqHeaders[h] === 'string') headers[h] = reqHeaders[h] as string
  }
  headers['referer'] = 'https://www.pixiv.net/'
  headers['user-agent'] = PROXY_USER_AGENT

  return proxyPass(event, {
    url,
    method: event.method,
    headers,
    responseHeaders: PROXY_RESPONSE_HEADERS,
    devLabel: 'pximg',
  })
})
