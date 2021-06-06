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
    const { data } = await request(`/user/${id}?full=1`)
    return res.send(data)
  } catch (error) {
    return res.status(500).send(error)
  }
}
