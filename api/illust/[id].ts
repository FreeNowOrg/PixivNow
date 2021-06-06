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
    const [details, pages] = await Promise.all([
      request(`/illust/${id}`),
      request(`/illust/${id}/pages`),
    ])
    return res.send({ ...details.data, pages: pages.data })
  } catch (err) {
    return res.status(503).send(err)
  }
}
