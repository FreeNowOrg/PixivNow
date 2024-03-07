import type { VercelRequest, VercelResponse } from '@vercel/node'
import escapeRegExp from 'lodash.escaperegexp'
import { ajax } from './utils.js'

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!isAccepted(req)) {
    return res.status(403).send('403')
  }

  try {
    const { __PREFIX, __PATH } = req.query
    const { data } = await ajax({
      method: req.method ?? 'GET',
      url: `/${encodeURI(`${__PREFIX}${__PATH ? '/' + __PATH : ''}`)}`,
      params: req.query ?? {},
      data: req.body || undefined,
      headers: req.headers as Record<string, string>,
    })
    res.status(200).send(data)
  } catch (e: any) {
    res.status(e?.response?.status || 500).send(e?.response?.data || e)
  }
}

function isAccepted(req: VercelRequest) {
  const { UA_BLACKLIST = '[]' } = process.env
  try {
    const list: string[] = JSON.parse(UA_BLACKLIST)
    const ua = req.headers['user-agent'] ?? ''
    return (
      !!ua &&
      Array.isArray(list) &&
      (list.length > 0
        ? !new RegExp(
            `(${list.map((str) => escapeRegExp(str)).join('|')})`,
            'gi'
          ).test(ua)
        : true)
    )
  } catch (e) {
    return false
  }
}
