import { VercelRequest, VercelResponse } from '@vercel/node'
import { getBuffer } from '../image'
import { dateFormat, handleError } from '../utils'
import { request } from '../utils'

import { Artwork } from '../../src/types'
interface ArtworkOrAd extends Artwork {
  isAdContainer?: boolean
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const isImage =
    (req.headers.accept?.includes('image') || req.query.format === 'image') &&
    req.query.format !== 'json'

  let data
  try {
    data = (
      await request({
        path: '/ajax/illust/discovery',
        params: {
          mode: req.query.mode || 'safe',
          max: isImage ? 1 : req.query.max || 18,
        },
        headers: req.headers,
      })
    ).data
  } catch (err) {
    return handleError(err, res)
  }

  let list: ArtworkOrAd[] = data?.illusts || []
  list = list
    .filter(({ isAdContainer }) => !isAdContainer)
    .map((item) => {
      // 将时间转换为日本时区，东 9 区
      let date = new Date(item.updateDate)
      const targetTimezone = -9
      // date 与机器时间相差的分钟数
      const minDiff = date.getTimezoneOffset()
      // 转换
      date = new Date(
        date.getTime() + minDiff * 60 * 1000 - targetTimezone * 60 * 60 * 1000
      )

      // 直接从 thumb 替换，并不优雅 ×
      // const middle = item.url
      //   .replace(/^\/-/, '')
      //   .replace(/^\/c\/.+?\//, '/')
      //   .replace(/^\/(custom-thumb|img-master)/, '')
      //   .replace(/^\//, '')
      //   .split('_p0_')[0]
      // 由时间生成
      const middle = `img/${dateFormat('yyyy/MM/dd/hh/mm/ss', date)}/${item.id}`

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
