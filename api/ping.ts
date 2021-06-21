import { VercelRequest, VercelResponse } from '@vercel/node'
import { request } from './utils'

export default async (req: VercelRequest, res: VercelResponse) => {
  const timestamp = Date.now()
  let status = true
  let error
  try {
    await request('get', '/users/10', {}, req.headers)
  } catch (err) {
    status = false
    error = err
  }
  res.send({
    status,
    timestamp,
    ping: Date.now() - timestamp,
    error,
  })
}
