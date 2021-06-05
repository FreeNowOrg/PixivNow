import { VercelRequest, VercelResponse } from '@vercel/node'
import { request, replaceUrl } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  try {
    const details = await request(`user/${id}`)
    return res.send(replaceUrl(details))
  } catch (error) {
    return res.status(500).send(error)
  }
}
