import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import { USER_AGENT } from './utils.js'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { __PREFIX, __PATH } = req.query
  if (!__PREFIX || !__PATH) {
    return res.status(400).send({ message: 'Missing param(s)' })
  }

  switch (__PREFIX) {
    case '~': {
      return axios
        .get<ArrayBuffer>(`https://s.pximg.net/${__PATH}`, {
          responseType: 'arraybuffer',
          headers: {
            referer: 'https://www.pixiv.net/',
            'user-agent': USER_AGENT,
          },
        })
        .then(
          ({ data, headers }) => {
            res.setHeader('Content-Type', headers['content-type'])
            res.setHeader(
              'Cache-Control',
              `public, max-age=${12 * 60 * 60 * 3600}`
            )
            res.status(200).send(Buffer.from(data))
          },
          (err) => {
            return res
              .status(err?.response?.status || 500)
              .send(err?.response?.data || err)
          }
        )
    }
    default:
      return res.status(400).send({ message: 'Invalid request' })
  }
}
