import { VercelRequest, VercelResponse } from '@vercel/node'
import { request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req
  const { word } = query
  try {
    const { data } = await request(
      `/search/artworks/${encodeURI(word as string)}`,
      {
        mode: 'safe',
        p: '1',
        ...query,
      }
    )
    res.send(data)
  } catch (err) {
    res.status(503).send(err)
  }
}
