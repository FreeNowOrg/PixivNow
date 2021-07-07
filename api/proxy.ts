import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { prefix, path } = req.query
  if (!prefix || !path) {
    return res.status(400).send({ message: 'Missing param(s)' })
  }
  const url = `https://${prefix}.pximg.net/${path}`

  axios
    .get(url, {
      responseType: 'arraybuffer',
      headers: {
        referer: 'https://www.pixiv.net/',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      },
    })
    .then(
      ({ data, headers }) => {
        res.setHeader('content-type', headers?.['content-type'])
        res.status(200).send(Buffer.from(data, 'base64'))
      },
      (err) => {
        return res
          .status(err?.response?.status || 503)
          .send(err?.response?.data || err)
      }
    )
}
