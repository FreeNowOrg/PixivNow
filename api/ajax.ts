import { VercelRequest, VercelResponse } from '@vercel/node'
import { replaceUrl, request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query
  delete req.query.path

  request(path, req.query).then(
    ({ data, headers }) => {
      res.setHeader('content-type', headers?.['content-type'])
      res.status(200).send(replaceUrl(data))
    },
    (err) => {
      res.status(503).send(err)
    }
  )
}
