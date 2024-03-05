import { VercelRequest, VercelResponse } from '@vercel/node'
import { formatInTimeZone } from 'date-fns-tz'
import { PXIMG_BASEURL_I, ajax } from './utils.js'
import { Artwork } from '../src/types/Artworks.js'

type ArtworkOrAd = Artwork | { isAdContainer: boolean }

export default async (req: VercelRequest, res: VercelResponse) => {
  const requestImage =
    (req.headers.accept?.includes('image') || req.query.format === 'image') &&
    req.query.format !== 'json'
  try {
    const data: { illusts?: ArtworkOrAd[] } = (
      await ajax({
        url: '/ajax/illust/discovery',
        params: {
          mode: req.query.mode ?? 'safe',
          max: requestImage ? '1' : req.query.max ?? '18',
        },
        headers: req.headers,
      })
    ).data
    const illusts = (data.illusts ?? []).filter((value): value is Artwork =>
      Object.keys(value).includes('id')
    )
    illusts.forEach((value) => {
      const middle = `img/${formatInTimeZone(
        value.updateDate,
        'Asia/Tokyo',
        'yyyy/MM/dd/HH/mm/ss'
      )}/${value.id}`
      value.urls = {
        mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
        thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
        small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
        regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
        original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`,
      }
    })
    if (requestImage) {
      res.redirect(illusts[0].urls.regular)
      return
    } else {
      res.send(illusts)
      return
    }
  } catch (e: any) {
    res.status(e?.response?.status ?? 500).send(e?.response?.data ?? e)
  }
}
