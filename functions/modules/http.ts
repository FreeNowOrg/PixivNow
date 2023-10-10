import { createFexios } from 'fexios'
import colors from 'picocolors'
import { EventContext, PagesFunction } from '@cloudflare/workers-types'
import escapeRegExp from 'lodash.escaperegexp'

interface Env {}

const PROD = process.env.NODE_ENV === 'production'

export class CookieUtils {
  static toJSON(raw: string) {
    return Object.fromEntries(new URLSearchParams(raw.replace(/;\s*/g, '&')))
  }
  static toString(obj: any) {
    return Object.keys(obj)
      .map((i) => `${i}=${obj[i]}`)
      .join(';')
  }
}

export async function handleHttpRequest(
  ctx: EventContext<any, any, any>
): Promise<Response> {
  const { request, params } = ctx
  const url = new URL(request.url)
  console.info('REQUEST', url.href, params)

  try {
    let { prefix, path } = params
    if (Array.isArray(prefix)) prefix = prefix.join('/')
    if (Array.isArray(path)) path = path.join('/')
    const uri = `/${prefix}/${encodeURI(path)}`.replace(/\/+/g, '/')
    const { data } = await ajax.request(uri, {
      method: (request.method as any) ?? 'GET',
      query: Object.fromEntries(url.searchParams.entries()) ?? {},
      body: request.body || undefined,
      headers: Object.fromEntries(request.headers.entries()),
    })
    return new Response(data)
  } catch (e: any) {
    console.error('PROXY ERROR', e, e.context)
    return new Response(e?.context?.data || e, {
      status: e?.response?.status || 500,
    })
  }
}

export const ajax = createFexios({
  baseURL: 'https://www.pixiv.net/',
  query: {},
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.62',
  },
  timeout: 30 * 1000,
})
ajax.on('beforeInit', (ctx) => {
  ctx.headers = (ctx.headers || {}) as Record<string, string>
  const cookies = CookieUtils.toJSON(ctx.headers.cookie || '')
  const csrfToken = ctx.headers['x-csrf-token'] ?? cookies.CSRFTOKEN ?? ''
  // 强制覆写部分 headers
  ctx.headers.host = 'www.pixiv.net'
  ctx.headers.origin = 'https://www.pixiv.net'
  ctx.headers.referer = 'https://www.pixiv.net/'
  ctx.headers['user-agent'] =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.62'
  ctx.headers['accept-language'] ??=
    'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
  csrfToken && (ctx.headers['x-csrf-token'] = csrfToken)

  if (!PROD) {
    console.info(
      colors.green(`[${ctx.method?.toUpperCase()}] <`),
      colors.cyan(ctx.url || '')
    )
    console.info({
      query: ctx.query,
      data: ctx.data,
      cookies,
    })
  }

  return ctx
})
ajax.interceptors.response.use((ctx) => {
  typeof ctx.data === 'object' &&
    (ctx.data = replaceUrlInObject(ctx.data?.body ?? ctx.data))
  if (!PROD) {
    const out: string =
      typeof ctx.data === 'object'
        ? JSON.stringify(ctx.data, null, 2)
        : ctx.data.toString().trim()
    console.info(
      colors.green('[SEND] >'),
      colors.cyan(ctx.rawRequest?.url?.replace('https://www.pixiv.net', '')),
      `\n${colors.yellow(typeof ctx.data)} ${
        out.length >= 200 ? out.slice(0, 200).trim() + '\n...' : out
      }`
    )
  }
  return ctx
})

export function replaceUrlInString(str: string): string {
  return str
    .replace(/https:\/\/i\.pximg\.net\//g, '/-/')
    .replace(/https:\/\/s\.pximg\.net\//g, '/~/')
}

export function replaceUrlInObject(
  obj: Record<string, any> | string
): Record<string, any> | string {
  if (typeof obj === 'string') return replaceUrlInString(obj)

  for (const key in obj) {
    if (
      typeof obj[key] === 'string' &&
      /^https:\/\/[is]\.pximg\.net\//.test(obj[key])
    ) {
      obj[key] = replaceUrlInString(obj[key])
    } else if (typeof obj[key] === 'object') {
      obj[key] = replaceUrlInObject(obj[key])
    }
  }
  return obj
}
