import escapeRegExp from 'lodash.escaperegexp'
import { pixivAjax } from '~~/server/utils/pixiv'

// Unified Pixiv API proxy middleware.
// Intercepts /ajax/*, /rpc/*, and *.php requests and proxies them to Pixiv.
// Mirrors the original Vercel rewrites:
//   /:__PREFIX(ajax|rpc|.+\.php)/:__PATH* → /api/http
const PROXY_PATTERNS = [/^\/ajax\//, /^\/rpc\//, /\.php$/]

function shouldProxy(pathname: string): boolean {
  return PROXY_PATTERNS.some((re) => re.test(pathname))
}

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  if (!shouldProxy(pathname)) {
    return // Not a proxied path, pass through
  }

  if (!isAccepted(event)) {
    throw createError({ statusCode: 403, message: '403' })
  }

  const query = getQuery(event)

  try {
    const { data } = await pixivAjax({
      method: event.method ?? 'GET',
      url: pathname,
      params: query ?? {},
      data: event.method !== 'GET' ? await readBody(event) : undefined,
      headers: getHeaders(event) as Record<string, string>,
    })
    return data
  } catch (e: any) {
    throw createError({
      statusCode: e?.response?.status || 500,
      data: e?.response?.data || String(e),
    })
  }
})

function isAccepted(event: any) {
  const config = useRuntimeConfig()
  const uaBlacklist = config.uaBlacklist || process.env.UA_BLACKLIST || '[]'
  try {
    const list: string[] = JSON.parse(uaBlacklist)
    const ua = getHeader(event, 'user-agent') ?? ''
    return (
      !!ua &&
      Array.isArray(list) &&
      (list.length > 0
        ? !new RegExp(
            `(${list.map((str) => escapeRegExp(str)).join('|')})`,
            'gi'
          ).test(ua)
        : true)
    )
  } catch (e) {
    return false
  }
}
