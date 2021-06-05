import { VercelRequest, VercelResponse } from '@vercel/node'
import Pixiv from 'pixiv-web-api'
const pixiv = new Pixiv({
  username: process.env.PIXIV_USERNAME,
  password: process.env.PIXIV_PASSWORD,
})

export default async (req: VercelRequest, res: VercelResponse) => {
  function replaceUrl(obj) {
    for (let key in obj) {
      if (
        typeof obj[key] === 'string' &&
        obj[key].startsWith('https://i.pximg.net/')
      ) {
        obj[key] = obj[key].replace('https://i.pximg.net/', `/imgProxy/`)
      } else if (typeof obj[key] === 'object') {
        obj[key] = replaceUrl(obj[key])
      }
    }
    return obj
  }

  const id = req.query.id as string
  if (!/^\d+$/g.test(id)) {
    return res.status(400).send({
      error: 'Invalid id',
    })
  }

  try {
    const [{ body: details }, { body: pages }] = await Promise.all([
      pixiv.illustDetails(id),
      pixiv.illustPages(id),
    ])

    return res.send({ ...replaceUrl(details), pages: replaceUrl(pages) })
  } catch (error) {
    return res.status(500).send(error)
  }
}
