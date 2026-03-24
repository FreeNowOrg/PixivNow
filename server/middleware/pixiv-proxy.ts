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

  if (!checkCanPassUaBlackList(event)) {
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

// Cached UA blacklist regex for efficient repeated checks
let _uaBlacklist: string[] | null = null
let _uaBlacklistRegex: RegExp | null = null
let _uaBlacklistInvalid = false

function getUaBlacklistRegex(): RegExp | null {
  if (_uaBlacklistInvalid) return null
  if (_uaBlacklistRegex) return _uaBlacklistRegex

  try {
    const config = useRuntimeConfig()
    const rawUaBlacklist = config.uaBlacklist || '[]'

    _uaBlacklist = JSON.parse(rawUaBlacklist)
    if (!Array.isArray(_uaBlacklist) || _uaBlacklist.length === 0) {
      _uaBlacklist = []
      _uaBlacklistRegex = null
      return null
    }

    _uaBlacklistRegex = new RegExp(
      `(${_uaBlacklist.map((str) => escapeRegExp(str)).join('|')})`,
      'gi'
    )
    return _uaBlacklistRegex
  } catch {
    // JSON parse error, treat as empty blacklist but log a warning
    _uaBlacklistInvalid = true
    return null
  }
}

/**
 * @returns {boolean}
 * - `true` - User-Agent is allowed (not in blacklist)
 * - `false` - User-Agent is blocked (matches blacklist)
 */
function checkCanPassUaBlackList(event: any): boolean {
  const ua = getHeader(event, 'user-agent') ?? ''
  if (!ua) return false // weird case: no user-agent header, reject by default

  const regex = getUaBlacklistRegex()

  // JSON parse error, treat as empty blacklist but log a warning
  if (_uaBlacklistInvalid) {
    console.warn(
      '[UA Blacklist] Invalid JSON format in configuration. Please check the NUXT_UA_BLACKLIST environment variable.'
    )
    return true
  }

  // Empty blacklist: allow all
  if (!regex) return true

  // If regex exists, block if it matches, allow if it doesn't
  return !regex.test(ua)
}
