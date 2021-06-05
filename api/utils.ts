import { Pixiv } from '@ibaraki-douji/pixivts'
const pixiv = new Pixiv()

function replaceUrl(obj) {
  for (let key in obj) {
    if (
      typeof obj[key] === 'string' &&
      obj[key].startsWith('https://i.pximg.net/')
    ) {
      obj[key] = obj[key].replace(
        'https://i.pximg.net/',
        `https://pixiv-now.vercel.app/proxy/`
      )
    } else if (typeof obj[key] === 'object') {
      obj[key] = replaceUrl(obj[key])
    }
  }
  return obj
}

export { pixiv, replaceUrl }
