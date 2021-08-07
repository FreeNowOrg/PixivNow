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
  return data.illusts || []
}
