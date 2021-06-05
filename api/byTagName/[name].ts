import { VercelRequest, VercelResponse } from '@vercel/node'
import { pixiv, replaceUrl } from '../utils'

type IllMode = 'all' | 'safe' | 'r18'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req
  const mode: IllMode = ['all', 'safe', 'r18'].includes(query.mode as IllMode)
    ? (query.mode as IllMode)
    : 'safe'
  try {
    const list = await pixiv.getIllustsByTag(query.name as string, {
      mode,
      page:
        parseInt(query.page as string) > 0 ? parseInt(query.page as string) : 1,
    })
    res.send(replaceUrl(list))
  } catch (err) {
    res.status(500).send(err)
  }
}
