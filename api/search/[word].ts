import { VercelRequest, VercelResponse } from '@vercel/node'
import { request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req
  const { word } = query
  try {
    const { data } = await request(
      'get',
      `/search/artworks/${encodeURI(word as string)}`,
      {
        mode: 'safe',
        p: '1',
        ...query,
      },
      req.headers
    )
    res.send(data)
  } catch (err) {
    return res.status(err?.response?.status || 503).send(err?.response || err)
  }
}
