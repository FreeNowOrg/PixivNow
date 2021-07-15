import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Set-Cookie', `TEST_DATE=${Date.now()}; path=/; secure`)
  res.send('ok')
}
