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
  params = {},
  headers?: any
) {
  const url = `https://www.pixiv.net/ajax${path}`

  // Safe headers
  // const headers1: any = {}
  // for (let key in headers) {
  //   const val = headers[key]
  //   if (typeof val === 'string') headers1[key] = val
  // }

  try {
    const res = await axios({
      url,
      method,
      params,
      headers: {
        ...headers,
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
