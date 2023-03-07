import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { IncomingHttpHeaders } from 'node:http'
import axios, { AxiosRequestConfig } from 'axios'
import cookie from 'cookie'

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!isAccepted(req)) {
    return res.status(403).send('403')
  }
  try {
    const { __PREFIX, __PATH } = req.query
    const { data } = await sendRequest({
      method: req.method ?? 'GET',
      path: `/${encodeURI(`${__PREFIX}${__PATH ? '/' + __PATH : ''}`)}`,
      params: req.query,
      data: req.body,
      headers: req.headers,
    })
    res.status(200).send(data)
  } catch (err) {
    const e = err as any
    res.status(e?.response?.status || 500).send(e?.response?.data || e)
  }
}

export async function sendRequest({
  method = 'GET',
  path = '/',
  params = {},
  data = null,
  headers = {},
}: {
  method?: string
  path?: string
  params?: Record<string, string | string[]>
  data?: any
  headers?: IncomingHttpHeaders
}) {
  const url = new URL(path, 'https://www.pixiv.net')
  const newParams = new URLSearchParams()

  // 做一些转换防止抑郁
  // "foo[]": [] -> "foo": []
  for (const [key, value] of Object.entries(params)) {
    if (key.endsWith('[]')) {
      const newKey = key.replace(/\[\]$/, '')
      if (Array.isArray(value)) {
        for (const v of value) {
          newParams.append(newKey, v)
        }
      } else {
        newParams.append(newKey, value)
      }
    } else {
      newParams.append(key, value.toString())
    }
  }
  const cookies = cookie.parse((headers.Cookie ?? '').toString())

  const config: AxiosRequestConfig = {
    method,
    url: url.href,
    params: newParams,
    data,
    timeout: 9000,
    headers: {
      Accept: headers.accept ?? '*/*',
      'Accept-Language':
        headers['accept-language'] ??
        'zh-CN, zh;q=0.8, zh-TW;q=0.7, zh-HK;q=0.5, en-US;q=0.3, en;q=0.2',
      Cookie: headers.cookie ?? '',
      // 避免国产阴间浏览器或手机端等导致的验证码
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0',

      // ↓ Keep these headers
      Host: 'www.pixiv.net',
      Origin: 'https://www.pixiv.net',
      Referer: 'https://www.pixiv.net/',
      // Token
      'X-Csrf-Token': headers['x-csrf-token'] ?? cookies.CSRFTOKEN ?? '',
    },
  }

  try {
    const res = await axios(config)
    res.data = replaceUrlInObject(res.data?.body ?? res.data)
    return res
  } catch (err) {
    console.error('[AxiosError]', err)
    throw err
  }
}

function replaceUrlInString(str: string): string {
  return str
    .replace(/https:\/\/i\.pximg\.net\//g, '/-/')
    .replace(/https:\/\/s\.pximg\.net\//g, '/~/')
}

function replaceUrlInObject(
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
        ? !new RegExp(`(${list.join('|')})`, 'gi').test(ua)
        : true)
    )
  } catch (e) {
    return false
  }
}
