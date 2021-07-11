import { VercelRequest, VercelResponse } from '@vercel/node'
import { handleError, request } from './utils'
import camelCaseKeys from 'camelcase-object-deep'

export interface RankingQuery {
  p?: number
  mode?:
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'rookie'
    | 'male'
    | 'female'
    | 'daily_r18'
    | 'weekly_r18'
    | 'monthly_r18'
  date?: string
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req

  request(
    'get',
    '/ranking.php',
    {
      ...query,
      format: 'json',
    },
    req.headers
  )
    .then(({ data }) => {
      data.contents = data?.contents?.map((i: any) => {
        i.xRestrict = i?.illust_content_type?.sexual || 0
        return i
      })
      res.send(camelCaseKeys(data))
    })
    .catch((err) => {
      return handleError(err, res)
    })
}
