import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import colors from 'picocolors'

// HTTP handler
export default async function (req: VercelRequest, res: VercelResponse) {
  res.status(404).send({
    error: true,
    message: 'Not Found',
    body: null,
  })
}

export const PROD = process.env.NODE_ENV === 'production'
export const DEV = !PROD
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
export const PXIMG_BASEURL_I = (() => {
  const i = process.env.VITE_PXIMG_BASEURL_I
  return i ? i.replace(/\/$/, '') + '/' : 'https://i.pximg.net/'
})()
export const PXIMG_BASEURL_S = (() => {
  const s = process.env.VITE_PXIMG_BASEURL_S
  return s ? s.replace(/\/$/, '') + '/' : 'https://s.pximg.net/'
})()

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

export const ajax = axios.create({
  baseURL: 'https://www.pixiv.net/',
  params: {},
  headers: {
    'user-agent': USER_AGENT,
  },
  timeout: 9 * 1000,
})
ajax.interceptors.request.use((ctx) => {
  // 去除内部参数
  ctx.params = ctx.params || {}
  delete ctx.params.__PATH
  delete ctx.params.__PREFIX

  const cookies = CookieUtils.toJSON(ctx.headers.cookie || '')
  const csrfToken = ctx.headers['x-csrf-token'] ?? cookies.CSRFTOKEN ?? ''
  // 强制覆写部分 headers
  ctx.headers = ctx.headers || {}
  ctx.headers.host = 'www.pixiv.net'
  ctx.headers.origin = 'https://www.pixiv.net'
  ctx.headers.referer = 'https://www.pixiv.net/'
  ctx.headers['user-agent'] = USER_AGENT
  ctx.headers['accept-language'] ??=
    'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
  csrfToken && (ctx.headers['x-csrf-token'] = csrfToken)

  if (DEV) {
    console.info(
      colors.green(`[${ctx.method?.toUpperCase()}] <`),
      colors.cyan(ctx.url || '')
    )
    console.info({
      params: ctx.params,
      data: ctx.data,
      cookies,
    })
  }

  return ctx
})
ajax.interceptors.response.use((ctx) => {
  typeof ctx.data === 'object' &&
    (ctx.data = replacePximgUrlsInObject(ctx.data?.body ?? ctx.data))
  if (DEV) {
    const out: string =
      typeof ctx.data === 'object'
        ? JSON.stringify(ctx.data, null, 2)
        : ctx.data.toString().trim()
    console.info(
      colors.green('[SEND] >'),
      colors.cyan(ctx.request?.path?.replace('https://www.pixiv.net', '')),
      `\n${colors.yellow(typeof ctx.data)} ${
        out.length >= 200 ? out.slice(0, 200).trim() + '\n...' : out
      }`
    )
  }
  return ctx
})

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

export function safelyStringify(value: any, space?: number) {
  const visited = new WeakSet()

  const replacer = (key: string, val: any) => {
    // 处理 BigInt
    if (typeof val === 'bigint') {
      return val.toString()
    }

    // 处理 Set
    if (val instanceof Set) {
      return Array.from(val)
    }

    // 处理 Map
    if (val instanceof Map) {
      return Array.from(val.entries())
    }

    // 处理 function
    if (typeof val === 'function') {
      return val.toString()
    }

    // 处理自循环引用
    if (typeof val === 'object' && val !== null) {
      if (visited.has(val)) {
        return '<circular>'
      }
      visited.add(val)
    }

    return val
  }

  return JSON.stringify(value, replacer, space)
}

JSON.safelyStringify = safelyStringify
declare global {
  interface JSON {
    safelyStringify: typeof safelyStringify
  }
}
