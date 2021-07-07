import { VercelRequest, VercelResponse } from '@vercel/node'
import cheerio from 'cheerio'
import { handleError, replaceUrl, request } from '../utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = req.cookies.PHPSESSID || req.query.token
  if (!token) {
    return res.status(403).send({ message: '未配置用户密钥' })
  }

  request('get', '/', req.query, req.headers)
    .then(({ data }) => {
      const $ = cheerio.load(data)
      const $meta = $('meta[name="global-data"]')
      if ($meta.length < 0 || !$meta.attr('content')) {
        return res.status(403).send({ message: '无效的用户密钥' })
      }
      try {
        let meta = $meta.attr('content') as string
        meta = JSON.parse(meta)
        if (!meta.userData) {
          throw 'userData is missing'
        }
        return res.send(replaceUrl(meta.userData))
      } catch (error) {
        throw {
          message: '意料外的元数据',
          cheerio: {
            length: $meta.length,
            html: $meta.prop('outerHTML')
          },
          error,
        }
      }
    })
    .catch((err) => {
      return handleError(err, res)
    })
}
