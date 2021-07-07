import { VercelRequest, VercelResponse } from '@vercel/node'
import { Method } from 'axios'
import { request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query
  delete req.query.path

  request(req.method as Method, `/ajax/${path}`, req.query, req.headers).then(
    ({ data }) => {
      res.status(200).send(data)
    },
    (err) => {
      return res
        .status(err?.response?.status || 500)
        .send(err?.response?.data || err)
    }
  )
}
