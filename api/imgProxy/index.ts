import axios from 'axios'
import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query

  axios
    .get(`https://i.pximg.net${path}`, {
      responseType: 'arraybuffer',
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
