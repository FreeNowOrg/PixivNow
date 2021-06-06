import axios from 'axios'

function replaceUrl(obj) {
  for (let key in obj) {
    if (
      typeof obj[key] === 'string' &&
      obj[key].startsWith('https://i.pximg.net/')
    ) {
      obj[key] = obj[key].replace(
        'https://i.pximg.net/',
        `https://pixiv-now.vercel.app/image/`
      )
    } else if (typeof obj[key] === 'object') {
      obj[key] = replaceUrl(obj[key])
    }
  }
  return obj
}

async function request(path: string, params = {}) {
  const url = `https://www.pixiv.net/ajax${path}`

  try {
    const res = await axios.get(url, {
      params,
      headers: {
        Referer: 'https://www.pixiv.net/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      },
    })
    res.data = replaceUrl(res.data?.body || res.data)
    return res
  } catch (err) {
    throw err
  }
}

export { request, replaceUrl }
