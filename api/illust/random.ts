import { VercelRequest, VercelResponse } from '@vercel/node'

import { request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { data } = await request({
    path: '/ajax/illust/discovery',
    params: {
      mode: req.query.mode || 'safe',
      max: req.query.max || 18,
    },
    headers: req.headers,
  })
  const list: any[] = data?.illusts || []
  list.forEach((item, index) => {
    if (item.isAdContainer) list.splice(index, 1)
  })

  if (req.headers.accept.includes('image')) {
    const url = list
      .shift()
      ?.url.replace(/\/c\/.+?\//, '/')
      .replace('square', 'master')
    res.redirect(url)
    return
  }

  res.send(list)
}
