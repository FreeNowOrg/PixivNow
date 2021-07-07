import { VercelRequest, VercelResponse } from '@vercel/node'
import { handleError, request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req
  request(
    'get',
    '/top/illust',
    {
      mode: 'all',
      lang: 'zh',
      ...query,
    },
    req.headers
  )
    .then(({ data }) => {
      const rankingItems: { rank: string; id: string }[] =
        data.page.ranking.items
      const illustList: any[] = data.thumbnails.illust

      const list = rankingItems.map((i) => {
        const illust = illustList.find(({ id }) => id === i.id)
        return {
          ...i,
          illust,
        }
      })

      res.send(list)
    })
    .catch((err) => {
      return handleError(err, res)
    })
}
