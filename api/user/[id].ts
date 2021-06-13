import { VercelRequest, VercelResponse } from '@vercel/node'
import { request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  Promise.all([
    request('get', `/user/${id}`, { full: 1, ...req.query }, req.headers),
    request('get', `/user/${id}/profile/top`, { ...req.query }, req.headers),
  ]).then(
    ([{ data: basic }, { data: more }]) => {
      const { illusts, manga, novels } = more
      const illList = [],
        mangaList = []

      for (let item in illusts) {
        illList.push(illusts[item])
      }
      for (let item in manga) {
        mangaList.push(manga[item])
      }

      const desc = (a, b) => b.id - a.d
      illList.sort(desc)
      mangaList.sort(desc)

      const data = {
        ...basic,
        illusts: illList,
        manga: mangaList,
        novels,
      }
      res.send(data)
    },
    (err) => {
      return res
        .status(err?.response?.status || 503)
        .send(err?.response?.data || err)
    }
  )
}
