import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import colors from 'picocolors'
import escapeRegExp from 'lodash.escaperegexp'

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

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!isAccepted(req)) {
    return res.status(403).send('403')
  }

  try {
    const { __PREFIX, __PATH } = req.query
    const { data } = await ajax({
      method: req.method ?? 'GET',
      url: `/${encodeURI(`${__PREFIX}${__PATH ? '/' + __PATH : ''}`)}`,
      params: req.query ?? {},
      data: req.body || undefined,
      headers: req.headers as Record<string, string>,
    })
    res.status(200).send(data)
  } catch (e: any) {
    res.status(e?.response?.status || 500).send(e?.response?.data || e)
  }
}

export const ajax = axios.create({
  baseURL: 'https://www.pixiv.net/',
  params: {},
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.69',
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
  ctx.headers['user-agent'] =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.69'
  ctx.headers['accept-language'] ??=
    'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6'
  csrfToken && (ctx.headers['x-csrf-token'] = csrfToken)

  if (!PROD) {
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
    (ctx.data = replaceUrlInObject(ctx.data?.body ?? ctx.data))
  if (!PROD) {
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

function isAccepted(req: VercelRequest) {
  const { UA_BLACKLIST = '[]' } = process.env
  try {
    const list: string[] = JSON.parse(UA_BLACKLIST)
    const ua = req.headers['user-agent'] ?? ''
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
