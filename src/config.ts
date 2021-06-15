import axios from 'axios'
axios.defaults.timeout = 45 * 1000

export const API_BASE =
  process.env.NODE_ENV === 'development' ? 'https://pixiv.js.org' : ''
export const GITHUB_REPO = 'https://github.com/PixivNow/PixivNow'
