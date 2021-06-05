import { VercelRequest, VercelResponse } from '@vercel/node'
import PixivAppApi from 'pixiv-app-api'
const pixiv = new PixivAppApi(
  process.env.PIXIV_USERNAME,
  process.env.PIXIV_PASSWORD,
  {
    camelcaseKeys: true,
  }
)

export default async (req: VercelRequest, res: VercelResponse) => {
  const id = parseInt(req.query?.id as string)
  if (isNaN(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  try {
    const detail = await pixiv.illustDetail(id)
    return res.send(detail)
  } catch (error) {
    return res.status(500).send(error)
  }
}
