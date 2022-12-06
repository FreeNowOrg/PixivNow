import { VercelRequest, VercelResponse } from '@vercel/node'
import { formatInTimeZone } from 'date-fns-tz'
import { handleError, request } from '../utils'

import { Artwork } from '../../src/types'

type ArtworkOrAd =
  | Artwork
  | {
      isAdContainer: true
    }

export default async (req: VercelRequest, res: VercelResponse) => {
  const isImage =
    (req.headers.accept?.includes('image') || req.query.format === 'image') &&
    req.query.format !== 'json'

  let data: { illusts: ArtworkOrAd[] | undefined }
  try {
    data = (
      await request({
        path: '/ajax/illust/discovery',
        params: {
          mode: req.query.mode || 'safe',
          max: isImage ? '1' : req.query.max || '18',
        },
        headers: req.headers,
      })
    ).data
  } catch (err) {
    return handleError(err, res)
  }

  const illust = (data?.illusts || []).filter(
    (item) => Object.keys(item).length > 1
  ) as Artwork[]
  const list = illust.map((item) => {
    const middle = `img/${formatInTimeZone(
      item.updateDate,
      'Asia/Tokyo',
      'yyyy/MM/dd/HH/mm/ss'
    )}/${item.id}`

    item.urls = {
      mini: `/-/c/48x48/img-master/${middle}_p0_square1200.jpg`,
      thumb: `/-/c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
      small: `/-/c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
      regular: `/-/img-master/${middle}_p0_master1200.jpg`,
      original: `/-/img-original/${middle}_p0.jpg`,
    }

    return item
  })

  // return image
  if (isImage) {
    res.redirect(list[0].urls.regular)
    return
  }

  // return JSON
  res.send(list)
}
