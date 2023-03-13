import { SITE_ENV } from '@/config'
import nprogress from 'nprogress'

export function setupAxios() {
  axios.defaults.timeout = 60 * 1000
  axios.defaults.headers['Content-Type'] = 'application/json'

  if (SITE_ENV === 'development') {
    axios.defaults.headers.referer = 'https://pixiv-now-dev.vercel.app/'
  }

  axios.interceptors.request.use((config) => {
    nprogress.start()
    return config
  })

  axios.interceptors.response.use(
    (res) => {
      nprogress.done()
      return res
    },
    (err) => {
      nprogress.done()
      return Promise.reject(err)
    }
  )
}
