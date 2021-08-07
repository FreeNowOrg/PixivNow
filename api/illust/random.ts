import { VercelRequest, VercelResponse } from '@vercel/node'
import { getBuffer } from '../image'
import { handleError } from '../utils'
import { request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const isImage =
    req.headers.accept.includes('image') || req.query.format === 'image'

  const { data } = await request({
    path: '/ajax/illust/discovery',
    params: {
      mode: req.query.mode || 'safe',
      max: isImage ? 1 : req.query.max || 18,
    },
    headers: req.headers,
  })
  const list: any[] = data?.illusts || []
  list.forEach((item, index) => {
    if (item.isAdContainer) list.splice(index, 1)
    // /-/c/250x250_80_a2/img-master/img/2007/09/09/22/14/07/20_p0_square1200.jpg
    const middle = item.url
      .replace(/^\/-/, '')
      .replace(/^\/c\/.+?\//, '/')
      .replace(/^\/(custom-thumb|img-master)/, '')
      .replace(/^\//, '')
      .split('_p0_')[0]
    item.urls = {
      mini: `/-/c/48x48/img-master/${middle}_p0_square1200.jpg`,
      thumb: `/-/c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
      small: `/-/c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
      regular: `/-/img-master/${middle}_p0_master1200.jpg`,
      original: `/-/img-original/${middle}_p0.jpg`,
    }
  })

  // return image
  if (isImage) {
    const url = list[0].urls.regular.replace('/-/', '/')
    getBuffer(`https://i.pximg.net${url}`).then(
      ({ data, headers }) => {
        res.setHeader('content-type', headers?.['content-type'])
        res.setHeader('cache-control', `no-store`)
        res.status(200).send(Buffer.from(data, 'base64'))
      },
      (err) => {
        handleError(err, res)
      }
    )
    return
  }

  // return JSON
  res.send(list)
}
