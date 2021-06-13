import { VercelRequest, VercelResponse } from '@vercel/node'
import { makeArtList, request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: true,
      message: 'Invalid Artwork ID',
    })
  }

  try {
    const [details, pages] = await Promise.all([
      request('get', `/illust/${id}`, {}, req.headers),
      request('get', `/illust/${id}/pages`, {}, req.headers),
    ])

    try {
      if (!req.query.full) delete details.data.noLoginData
      delete details.data.zoneConfig

      details.data.userIllusts = makeArtList(details.data.userIllusts)
    } catch (e) {}

    return res.send({ ...details.data, pages: pages.data })
  } catch (err) {
    return res
      .status(err?.response?.status || 503)
      .send(err?.response?.data || err)
  }
}
