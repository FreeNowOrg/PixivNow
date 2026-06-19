import type { H3Event } from 'h3'
import colors from 'picocolors'

export const PROD = process.env.NODE_ENV === 'production'
export const DEV = !PROD
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'

export const PXIMG_BASEURL_I = (() => {
  const i =
    process.env.NUXT_PUBLIC_PXIMG_BASEURL_I ||
    process.env.VITE_PXIMG_BASEURL_I
  return i ? i.replace(/\/$/, '') + '/' : '/-/'
})()

export const PXIMG_BASEURL_S = (() => {
  const s =
    process.env.NUXT_PUBLIC_PXIMG_BASEURL_S ||
    process.env.VITE_PXIMG_BASEURL_S
  return s ? s.replace(/\/$/, '') + '/' : '/~/'
})()

export class CookieUtils {
  static toJSON(raw: string): Record<string, string> {
    const result: Record<string, string> = {}
    if (!raw) return result
    for (const pair of raw.split(';')) {
      const idx = pair.indexOf('=')
      if (idx === -1) continue
      const key = pair.slice(0, idx).trim()
      const val = pair.slice(idx + 1).trim()
      if (key) result[key] = val
    }
    return result
  }
  static toString(obj: Record<string, string>): string {
    return Object.entries(obj)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
  }
}

// --- Proxy-aware fetch ---

async function proxyAwareFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  if (import.meta.dev) {
    const proxyUrl =
      process.env.https_proxy ||
      process.env.HTTPS_PROXY ||
      process.env.http_proxy ||
      process.env.HTTP_PROXY
    if (proxyUrl) {
      const { fetch: undiciFetch, ProxyAgent } = await import('undici')
      return undiciFetch(url, {
        ...init,
        dispatcher: new ProxyAgent(proxyUrl),
      } as any) as unknown as Response
    }
  }
  return globalThis.fetch(url, init)
}

// --- Pixiv API client ---

export class PixivResponseError extends Error {
  response: { status: number; data: any }
  constructor(status: number, data: any) {
    super(`Pixiv API error: ${status}`)
    this.response = { status, data }
  }
}

interface PixivFetchOptions {
  event: H3Event
  method?: string
  url: string
  params?: Record<string, any>
  data?: any
}

export async function pixivFetch(
  opts: PixivFetchOptions
): Promise<{ data: any }> {
  const { event } = opts
  const method = (opts.method ?? 'GET').toUpperCase()

  // Build URL with query params
  const url = new URL(opts.url, 'https://www.pixiv.net/')
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v == null || k === '__PATH' || k === '__PREFIX') continue
      if (Array.isArray(v)) {
        for (const item of v) {
          url.searchParams.append(k, String(item))
        }
      } else {
        url.searchParams.set(k, String(v))
      }
    }
  }

  // Extract auth info from incoming request via h3 (case-insensitive)
  const token = (getHeader(event, 'authorization') || '')
    .replace(/^Bearer\s+/i, '')
  const cookies = { ...parseCookies(event) }
  const csrfToken =
    getHeader(event, 'x-csrf-token') ?? cookies.CSRFTOKEN ?? ''

  if (token) {
    cookies.PHPSESSID = token
  }

  const headers: Record<string, string> = {
    origin: 'https://www.pixiv.net',
    referer: 'https://www.pixiv.net/',
    'user-agent': USER_AGENT,
    'accept-language':
      getHeader(event, 'accept-language') ??
      'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    cookie: CookieUtils.toString(cookies),
  }
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  // Prepare body
  let body: string | undefined
  if (method !== 'GET' && opts.data != null) {
    body =
      typeof opts.data === 'string'
        ? opts.data
        : JSON.stringify(opts.data)
    if (typeof opts.data !== 'string') {
      headers['content-type'] = 'application/json'
    }
  }

  if (DEV) {
    console.info(
      colors.green(`[${method}] <`),
      colors.cyan(url.pathname + url.search)
    )
    console.info({ params: opts.params, data: opts.data, cookies })
  }

  const response = await proxyAwareFetch(url.toString(), {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(9000),
  })

  if (!response.ok) {
    const errorData = await response.text().catch(() => '')
    throw new PixivResponseError(response.status, errorData)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (DEV) {
    const out =
      typeof data === 'object'
        ? JSON.stringify(data, null, 2)
        : String(data).trim()
    console.info(
      colors.green('[SEND] >'),
      colors.cyan(url.pathname),
      `\n${colors.yellow(typeof data)} ${
        out.length >= 200 ? out.slice(0, 200).trim() + '\n...' : out
      }`
    )
  }

  return { data }
}

// --- Pximg proxy fetch ---

export async function pximgFetch(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  return proxyAwareFetch(url, {
    headers: {
      ...headers,
      referer: 'https://www.pixiv.net/',
      'user-agent': USER_AGENT,
    },
  })
}

// --- URL replacement utilities ---

export function replacePximgUrlsInString(str: string): string {
  if (!str.includes('pximg.net')) return str
  return str
    .replaceAll('https://i.pximg.net/', PXIMG_BASEURL_I)
    .replaceAll('https://s.pximg.net/', PXIMG_BASEURL_S)
}

export function replacePximgUrlsInObject(
  obj: Record<string, any> | string
): Record<string, any> | string {
  if (typeof obj === 'string') return replacePximgUrlsInString(obj)
  return deepReplaceString(obj, replacePximgUrlsInString)
}

function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

export function deepReplaceString<T>(
  obj: T,
  replacer: (value: string) => string
): T {
  if (Array.isArray(obj)) {
    return obj.map((value) =>
      deepReplaceString(value, replacer)
    ) as unknown as T
  } else if (isObject(obj)) {
    if (
      ['arraybuffer', 'blob', 'formdata'].includes(
        obj.constructor.name.toLowerCase()
      )
    ) {
      return obj
    }
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepReplaceString(value, replacer)
    }
    return result as T
  } else if (typeof obj === 'string') {
    return replacer(obj) as unknown as T
  }
  return obj
}
