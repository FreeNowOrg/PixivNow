import { VercelRequest, VercelResponse } from '@vercel/node'
import { Method } from 'axios'
import { isAccepted, request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  if (!isAccepted(req)) {
    return res.status(403).send('403')
  }
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
    const e = err as any
    res.status(e?.response?.status || 500).send(e?.response?.data || e)
  }
}
