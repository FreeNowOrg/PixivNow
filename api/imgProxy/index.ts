import axios from 'axios'
import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query

  axios
    .get(`https://i.pximg.net${path}`, {
      responseType: 'arraybuffer',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      },
    })
    .then(
      ({ data, headers }) => {
        if (headers?.['content-type']) {
          res.setHeader('Content-Type', headers['content-type'])
        }
        res.status(200).send(Buffer.from(data, 'base64'))
      },
      (err) => {
        res.status(503).send(err)
      }
    )
}
