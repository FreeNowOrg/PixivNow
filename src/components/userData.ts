import Cookies from 'js-cookie'
import { API_BASE } from '../config'
import { getJSON } from '../utils/fetch'

export interface PixivUser {
  id: string
  pixivId: string
  name: string
  profileImg: string
  profileImgBig: string
  premium: boolean
  xRestrict: 0 | 1 | 2
  adult: boolean
  safeMode: boolean
  illustCreator: boolean
  novelCreator: boolean
}

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
    const data = await getJSON<{ userData: PixivUser; token: string }>(
      `${API_BASE}/api/user`,
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    )
    if (data.token) {
      console.log('session ID认证成功', data)
      Cookies.set('CSRFTOKEN', data.token)
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
  const uid = Math.floor(100000000 * Math.random())
  const secret = (() => {
    const strSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const final = []
    for (let i = 0; i < 32; i++) {
      const charIndex = Math.floor(Math.random() * strSet.length)
      final.push(strSet[charIndex])
    }
    return final.join('')
  })()
  return `${uid}_${secret}`
}
