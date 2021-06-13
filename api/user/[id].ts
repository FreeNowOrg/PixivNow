import { VercelRequest, VercelResponse } from '@vercel/node'
import { request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  try {
    const { data } = await request(
      'get',
      `/user/${id}`,
      { full: 1, ...req.query },
      req.headers
    )
    return res.send(data)
  } catch (err) {
    return res
      .status(err?.response?.status || 503)
      .send(err?.response?.data || err)
  }
}
