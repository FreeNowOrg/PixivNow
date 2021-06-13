import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query
  const url = `https://i.pximg.net/${path}`

  axios
    .get(url, {
      responseType: 'arraybuffer',
      headers: {
        ...req.headers,
        referer: 'https://www.pixiv.net/',
      },
    })
    .then(
      ({ data, headers }) => {
        res.setHeader('content-type', headers?.['content-type'])
        res.status(200).send(Buffer.from(data, 'base64'))
      },
      ({ response }) => {
        return res.status(response.status || 503).send(response)
      }
    )
}
