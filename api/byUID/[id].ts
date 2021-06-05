import { VercelRequest, VercelResponse } from '@vercel/node'
import { pixiv, replaceUrl } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query.id as string
  if (!/^\d+$/.test(id)) {
    return res.status(400).send({ error: 'Invalid id' })
  }
  try {
    const list = await pixiv.getIllustsByUserID(id)
    res.send(replaceUrl(list))
  } catch (err) {
    res.status(500).send(err)
  }
}
