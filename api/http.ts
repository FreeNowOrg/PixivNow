import { VercelRequest, VercelResponse } from '@vercel/node'
import { Method } from 'axios'
import { request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { __PREFIX, __PATH } = req.query
    const { data } = await request({
      method: req.method as Method,
      path: `/${encodeURI(`${__PREFIX}${__PATH ? '/' + __PATH : ''}`)}`,
      params: req.query,
      data: req.body,
      headers: req.headers,
    })
    res.status(200).send(data)
  } catch (err) {
    res.status(err?.response?.status || 500).send(err?.response?.data || err)
  }
}
