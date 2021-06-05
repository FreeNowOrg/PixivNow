import { VercelRequest, VercelResponse } from '@vercel/node'
// import { Pixiv } from '@ibaraki-douji/pixivts'
// import { fromBuffer } from 'file-type'
import axios from 'axios'

export default async (req: VercelRequest, res: VercelResponse) => {
  const { path } = req.query
  const url = `https://i.pximg.net/${path}`

  // pixiv.download(new URL(url)).then(
  //   async (image) => {
  //     const fileType = await fromBuffer(image)
  //     res.setHeader('content-type', fileType.mime)
  //     res.status(200).send(image)
  //   },
  //   (err) => {
  //     res.status(503).send(err)
  //   }
  // )
  axios
    .get(url, {
      responseType: 'arraybuffer',
      headers: {
        Referer: 'https://www.pixiv.net/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      },
    })
    .then(
      ({ data, headers }) => {
        res.setHeader('content-type', headers?.['content-type'])
        res.status(200).send(Buffer.from(data, 'base64'))
      },
      (err) => {
        res.status(503).send(err)
      }
    )
}
