import { pximgFetch } from '~~/server/utils/pixiv'

// Unified pximg image proxy middleware.
// Intercepts /-/* and /~/* requests and proxies them to pximg.
// Mirrors the original Vercel rewrite:
//   /:__PREFIX(~|-)/:__PATH(.+) → /api/image
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

  // Match /-/... or /~/...
  const match = pathname.match(/^\/([-~])\/(.+)/)
  if (!match) {
    return // Not an image proxy request, pass through
  }

  const [, prefix, path] = match
  const baseUrl = PREFIX_MAP[prefix!]
  if (!baseUrl) return

  const url = `${baseUrl}${path}`

  const reqHeaders = getHeaders(event)

  const headers: Record<string, string> = {}
  for (const h of PROXY_REQUEST_HEADERS) {
    if (typeof reqHeaders[h] === 'string') {
      headers[h] = reqHeaders[h]
    }
  }

  try {
    const response = await pximgFetch(url, headers)

    for (const h of PROXY_RESPONSE_HEADERS) {
      const val = response.headers.get(h)
      if (val) {
        setResponseHeader(event, h, val)
      }
    }
    setResponseStatus(event, response.status)
    return response
  } catch (err: any) {
    console.error('Image proxy error:', url, err?.message)
    throw createError({
      statusCode: err?.response?.status || 500,
      data: err?.response?.data || String(err),
    })
  }
})
