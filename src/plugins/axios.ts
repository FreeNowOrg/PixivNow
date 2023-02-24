import { API_BASE } from '@/config'
import nprogress from 'nprogress'

export function setupAxios() {
  axios.defaults.timeout = 60 * 1000
  axios.defaults.baseURL = API_BASE
  axios.defaults.headers['Content-Type'] = 'application/json'

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
