import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pixiv } from '@ibaraki-douji/pixivts'
const pixiv = new Pixiv()

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = req.query?.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  try {
    const detail = await pixiv.getIllustByID(id)
    return res.send(detail)
  } catch (error) {
    return res.status(500).send(error)
  }
}
