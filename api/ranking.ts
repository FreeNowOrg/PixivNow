import { VercelRequest, VercelResponse } from '@vercel/node'
import { handleError, request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req
  request(
    'get',
    '/top/illust',
    {
      mode: 'safe',
      lang: 'zh',
      ...query,
    },
    req.headers
  )
    .then(({ data }) => {
      const rankingItems: { rank: string; id: string }[] =
        data.page.ranking.item
      const illustList: any[] = data.page.thumbnails.illust

      rankingItems.map((i) => {
        const details = illustList.find(({ id }) => id === i.id)
        return {
          ...i,
          details,
        }
      })

      res.send(rankingItems)
    })
    .catch((err) => {
      return handleError(err, res)
    })
}
