import { VercelRequest, VercelResponse } from '@vercel/node'
import { request, replaceUrl } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req
  const { word } = query
  try {
    const list = await request(`search/artworks/${word}`, { mode: 'safe', p: '1', ...query })
    res.send(replaceUrl(list))
  } catch (err) {
    res.status(500).send(err)
  }
}
