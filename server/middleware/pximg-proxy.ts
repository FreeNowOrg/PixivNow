import axios from 'axios'
import { USER_AGENT } from '~~/server/utils/pixiv'

// Unified pximg image proxy middleware.
// Intercepts /-/* and /~/* requests and proxies them to pximg.
// Mirrors the original Vercel rewrite:
//   /:__PREFIX(~|-)/:__PATH(.+) → /api/image
const PREFIX_MAP: Record<string, string> = {
  '-': 'https://i.pximg.net/',
  '~': 'https://s.pximg.net/',
}

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname

  // Match /-/... or /~/...
  const match = pathname.match(/^\/([-~])\/(.+)/)
  if (!match) {
    return // Not an image proxy request, pass through
  }

  const [, prefix, path] = match
  const baseUrl = PREFIX_MAP[prefix]
  if (!baseUrl) return

  const url = `${baseUrl}${path}`

  const reqHeaders = getHeaders(event)
  const proxyHeaderNames = [
    'accept',
    'accept-encoding',
    'accept-language',
    'range',
    'if-range',
    'if-none-match',
    'if-modified-since',
    'cache-control',
  ]

  const headers: Record<string, string> = {}
  for (const h of proxyHeaderNames) {
    if (typeof reqHeaders[h] === 'string') {
      headers[h] = reqHeaders[h]
    }
  }
  Object.assign(headers, {
    referer: 'https://www.pixiv.net/',
    'user-agent': USER_AGENT,
  })

  try {
    const {
      data,
      headers: respHeaders,
      status,
    } = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers,
    })

    const exposeHeaders = [
      'content-type',
      'content-length',
      'cache-control',
      'content-disposition',
      'last-modified',
      'etag',
      'accept-ranges',
      'content-range',
      'vary',
    ]
    for (const h of exposeHeaders) {
      if (typeof respHeaders[h] === 'string') {
        setResponseHeader(event, h, respHeaders[h])
      }
    }
    setResponseStatus(event, status)
    return Buffer.from(data)
  } catch (err: any) {
    console.error('Image proxy error:', url, err?.message)
    throw createError({
      statusCode: err?.response?.status || 500,
      data: err?.response?.data || String(err),
    })
  }
})
