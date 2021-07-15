import { VercelRequest, VercelResponse } from '@vercel/node'
import { Method } from 'axios'
import { request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { __PREFIX, __PATH } = req.query
  request({
    method: req.method as Method,
    path: `/${__PREFIX}${__PATH ? '/' + __PATH : ''}`,
    params: req.query,
    data: req.body,
    headers: req.headers,
  }).then(
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
