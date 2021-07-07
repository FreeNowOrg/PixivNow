import axios, { Method } from 'axios'

function makeArtList(obj: any) {
  const list = []
  for (let item in obj) {
    list.push(obj[item])
  }
  list.sort((a, b) => b.id - a.d)
  return list
}

function replaceUrl(obj: any) {
  for (let key in obj) {
    if (
      typeof obj[key] === 'string' &&
      obj[key].startsWith('https://i.pximg.net/')
    ) {
      obj[key] = obj[key].replace('https://i.pximg.net/', '/-/')
    } else if (typeof obj[key] === 'object') {
      obj[key] = replaceUrl(obj[key])
    }
  }
  return obj
}

async function request(
  method: Method,
  path: string,
  params?: any,
  headers?: any
) {
  const url = `https://www.pixiv.net/ajax${path}`
  const defaultAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  const defaultCookie = params.token ? 'PHPSESSID=' + params.token : ''

  try {
    const res = await axios({
      url,
      method,
      params,
      headers: {
        accept: headers.accept || '*/*',
        'accept-language':
          headers['accept-language'] ||
          'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        cookie: headers.cookie || defaultCookie,
        'user-agent': headers['user-agent'] || defaultAgent,
        referer: 'https://www.pixiv.net/',
      },
    })
    res.data = replaceUrl(res.data?.body || res.data)
    return res
  } catch (err) {
    console.error('axios error', err)
    throw err
  }
}

export { makeArtList, request, replaceUrl }
