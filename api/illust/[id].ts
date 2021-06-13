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
      request('get', `/illust/${id}`, {}, req.headers),
      request('get', `/illust/${id}/pages`, {}, req.headers),
    ])
    try {
      delete details.data.noLoginData
      delete details.data.zoneConfig
    } catch (e) {}
    return res.send({ ...details.data, pages: pages.data })
  } catch ({ response }) {
    return res.status(response.status || 503).send(response)
  }
}
