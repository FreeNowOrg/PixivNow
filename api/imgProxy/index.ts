import { Pixiv } from '@ibaraki-douji/pixivts'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { fromBuffer } from 'file-type'

const pixiv = new Pixiv()

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query

  pixiv
    .download(new URL(`https://i.pximg.net/${path}`))
    .then(
      async (image) => {
        const fileType = await fromBuffer(image)
        res.setHeader('content-type', fileType.mime)
        res.status(200).send(image)
      },
      (err) => {
        res.status(503).send(err)
      }
    )
}
