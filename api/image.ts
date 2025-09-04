import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { USER_AGENT } from './utils.js'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { __PREFIX, __PATH } = req.query
  if (!__PREFIX || !__PATH) {
    return res.status(400).send({ message: 'Missing param(s)' })
  }

  let url = ''

  switch (__PREFIX) {
    case '-': {
      url = `https://i.pximg.net/${__PATH}`
      break
    }
    case '~': {
      url = `https://s.pximg.net/${__PATH}`
      break
    }
    default:
      return res.status(400).send({ message: 'Invalid request' })
  }

  const proxyHeaders = [
    'accept',
    'accept-encoding',
    'accept-language',
    'range',
    'if-range',
    'if-none-match',
    'if-modified-since',
    'cache-control',
  ]

  const headers = {} as Record<string, string>
  for (const h of proxyHeaders) {
    if (typeof req.headers[h] === 'string') {
      headers[h] = req.headers[h]
    }
  }
  Object.assign(headers, {
    referer: 'https://www.pixiv.net/',
    'user-agent': USER_AGENT,
  })

  console.log('Proxy image:', url, headers)

  return axios
    .get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers,
    })
    .then(
      ({ data, headers, status }) => {
        const exposeHeaders = [
          'content-type',
          'content-length',
          'cache-control',
          'content-disposition',
          'last-modified',
          'etag',
          'accept-ranges',
          'content-range',
          'vary',
        ]
        for (const h of exposeHeaders) {
          if (typeof headers[h] === 'string') {
            res.setHeader(h, headers[h])
          }
        }
        res.status(status).send(Buffer.from(data))
      },
      (err) => {
        console.error('Image proxy error:', err)
        return res
          .status(err?.response?.status || 500)
          .send(err?.response?.data || err)
      }
    )
}
