import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  res.send({
    timestamp: Date.now(),
  })
}
