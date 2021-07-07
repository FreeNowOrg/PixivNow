import { VercelRequest, VercelResponse } from '@vercel/node'
import { makeArtList, request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: true,
      message: 'Invalid User ID',
    })
  }

  Promise.all([
    request('get', `/user/${id}`, { full: 1, ...req.query }, req.headers),
    request('get', `/user/${id}/profile/top`, req.query, req.headers),
  ]).then(
    ([{ data: basic }, { data: more }]) => {
      const { illusts, manga, novels } = more

      const data = {
        ...basic,
        illusts: makeArtList(illusts),
        manga: makeArtList(manga),
        novels,
      }
      res.send(data)
    },
    (err) => {
      return res
        .status(err?.response?.status || 500)
        .send(err?.response?.data || err)
    }
  )
}
