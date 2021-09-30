import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { handleError } from './utils'
import { IMAGE_CACHE_SECONDS } from '../src/config'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { __PREFIX, __PATH } = req.query
  if (!__PREFIX || !__PATH) {
    return res.status(400).send({ message: 'Missing param(s)' })
  }

  let domain
  switch (__PREFIX) {
    case 'image':
    case '-':
      // domain = 'i'
      return res.redirect(`https://i.pixiv.cat/${__PATH}`)
    case '~':
      domain = 's'
      break
    default:
      return res.status(400).send({ message: 'Invalid request' })
  }

  const url = `https://${domain}.pximg.net/${__PATH}`

  getBuffer(url).then(
    ({ data, headers }) => {
      res.setHeader('content-type', headers?.['content-type'])
      res.setHeader('cache-control', `public, max-age=${IMAGE_CACHE_SECONDS}`)
      res.status(200).send(Buffer.from(data, 'base64'))
    },
    (err) => {
      handleError(err, res)
    }
  )
}

export function getBuffer(url: string) {
  return axios.get(url, {
    responseType: 'arraybuffer',
    headers: {
      referer: 'https://www.pixiv.net/',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    },
  })
}
