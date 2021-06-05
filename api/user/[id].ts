import { VercelRequest, VercelResponse } from '@vercel/node'
import Pixiv from 'pixiv-web-api'
const pixiv = new Pixiv({
  username: process.env.PIXIV_USERNAME,
  password: process.env.PIXIV_PASSWORD,
})

export default async (req: VercelRequest, res: VercelResponse) => {
  res.send(req.query)
}
