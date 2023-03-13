import { PixivUser } from '@/types'
import Cookies from 'js-cookie'

export function existsSessionId(): boolean {
  const sessionId = Cookies.get('PHPSESSID')
  if (sessionId) {
    return true
  } else {
    Cookies.remove('CSRFTOKEN')
    return false
  }
}

export async function initUser(): Promise<PixivUser> {
  try {
    const { data } = await axios.get<{ userData: PixivUser; token: string }>(
      `/api/user`,
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
    if (data.token) {
      console.log('session ID认证成功', data)
      Cookies.set('CSRFTOKEN', data.token, { secure: true, sameSite: 'Strict' })
      const res = data.userData
      return res
    } else {
      Cookies.remove('CSRFTOKEN')
      return Promise.reject('无效的session ID')
    }
  } catch (err) {
    Cookies.remove('CSRFTOKEN')
    return Promise.reject(err)
  }
}

export function login(token: string): Promise<PixivUser> {
  if (!validateSessionId(token)) {
    console.error('访问令牌格式错误')
    return Promise.reject('访问令牌格式错误')
  }
  Cookies.set('PHPSESSID', token, {
    expires: 180,
    path: '/',
    secure: true,
    sameSite: 'Strict',
  })
  return initUser()
}

export function logout(): void {
  const token = Cookies.get('PHPSESSID')
  if (token && confirm(`您要移除您的令牌吗？\n${token}`)) {
    Cookies.remove('PHPSESSID')
    Cookies.remove('CSRFTOKEN')
  }
}

export function validateSessionId(token: string): boolean {
  return /^\d{2,10}_[0-9A-Za-z]{32}$/.test(token)
}

export function exampleSessionId(): string {
  const uid = new Uint32Array(1)
  window.crypto.getRandomValues(uid)
  const secret = (() => {
    const strSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const final = []
    const indexes = new Uint8Array(32)
    window.crypto.getRandomValues(indexes)
    for (const i of indexes) {
      const charIndex = Math.floor((i * strSet.length) / 256)
      final.push(strSet[charIndex])
    }
    return final.join('')
  })()
  return `${uid[0]}_${secret}`
}
