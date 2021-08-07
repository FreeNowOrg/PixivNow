import { VercelResponse } from '@vercel/node'
import axios, { AxiosRequestConfig, Method } from 'axios'

export function makeArtList(obj: any) {
  const list = []
  for (const item in obj) {
    list.push(obj[item])
  }
  list.sort((a, b) => b.id - a.id)
  return list
}

export function replaceUrl(obj: any) {
  const replace = (str: string) =>
    str
      .replace(/https:\/\/i\.pximg\.net\//g, '/-/')
      .replace(/https:\/\/s\.pximg\.net\//g, '/~/')

  if (typeof obj === 'string') return replace(obj)

  for (const key in obj) {
    if (
      typeof obj[key] === 'string' &&
      /^https:\/\/[is]\.pximg\.net\//.test(obj[key])
    ) {
      obj[key] = replace(obj[key])
    } else if (typeof obj[key] === 'object') {
      obj[key] = replaceUrl(obj[key])
    }
  }
  return obj
}

export function dateFormat(fmt: string, date?: Date) {
  date = date || new Date()
  var o = {
    'M+': date.getMonth() + 1, //月份
    'd+': date.getDate(), //日
    'h+': date.getHours(), //小时
    'm+': date.getMinutes(), //分
    's+': date.getSeconds(), //秒
    'q+': Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + '').substr(4 - RegExp.$1.length)
    )
  }
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  return fmt
}

export function cookiesObj(cookies: string) {
  let obj: Record<string, string> = {}
  cookies?.split(';').forEach((i) => {
    const s = i.split('=')
    if (s.length < 2) return
    const key = s[0].trim()
    const val = s[1].trim()
    obj[key] = val
  })
  return obj
}

export function handleError(err: any, res: VercelResponse) {
  return res
    .status(err?.response?.status || 500)
    .send(err?.response?.data || err)
}

export async function request({
  method = 'get',
  path = '/',
  params,
  data,
  headers,
}: {
  method?: Method
  path?: `/${string}`
  params?: any
  data?: string
  headers?: any
}) {
  const url = `https://www.pixiv.net${path}`
  const cookies = cookiesObj(headers.cookie)

  // 做一些转换防止抑郁
  // "foo[]": [] -> "foo": []
  for (const i in params) {
    if (i.endsWith('[]') && Array.isArray(params[i])) {
      params[i.replace(/\[\]$/, '')] = params[i]
      delete params[i]
    }
  }

  const config: AxiosRequestConfig = {
    url,
    method,
    params,
    data,
    timeout: 9000,
    headers: {
      accept: headers.accept || '*/*',
      'accept-language':
        headers['accept-language'] ||
        'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
      cookie: headers.cookie || '',
      // 避免国产阴间浏览器或手机端等导致的验证码
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',

      // ↓ Keep these headers
      host: 'www.pixiv.net',
      origin: 'https://www.pixiv.net',
      referer: 'https://www.pixiv.net/',
      // Token
      'x-csrf-token': headers['x-csrf-token'] || cookies.CSRFTOKEN || '',
    },
  }

  try {
    const res = await axios(config)
    res.data = replaceUrl(res.data?.body || res.data)
    return res
  } catch (err) {
    console.error('[AxiosError]', err)
    throw err
  }
}
