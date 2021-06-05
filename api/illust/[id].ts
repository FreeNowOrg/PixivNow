import { VercelRequest, VercelResponse } from '@vercel/node'
import { Pixiv } from '@ibaraki-douji/pixivts'
const pixiv = new Pixiv()

export default async (req: VercelRequest, res: VercelResponse) => {
  function replaceUrl(str: string): string {
    let origin
    try {
      const url = new URL(req.url)
      origin = url.origin
    } catch (e) {
      origin = ''
    }
    return str.replace('https://i.pximg.net/', `${origin}/imgProxy/`)
  }

  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  try {
    const detail = await pixiv.getIllustByID(id)
    if (detail?.user?.avatar) {
      detail.user.avatar = replaceUrl(detail.user.avatar)
    }
    detail.urls.map((item) => {
      for (let index in item) {
        item[index] = replaceUrl(item[index])
      }
      return item
    })
    return res.send({ url: req.url, ...detail })
  } catch (error) {
    return res.status(500).send(error)
  }
}
