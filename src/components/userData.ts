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
  PHPSESSID: string
  CSRFTOKEN?: string
}

export function checkSessionId(): boolean {
  const sessionId = Cookies.get('PHPSESSID')
  if (!sessionId) {
    Cookies.remove('CSRFTOKEN')
    return false
  } else {
    return true
  }
}

export async function userInit(): Promise<PixivUser> {
  const sessionId = Cookies.get('PHPSESSID')
  try {
    const data = await getJSON<{ userData: PixivUser; token: string }>(
      `${API_BASE}/api/user`,
      {
        headers: {
          'cache-control': 'no-store',
        },
      }
    )
    if (!data.token) {
      Cookies.remove('CSRFTOKEN')
      return Promise.reject('无效的session ID')
    }
    console.log('session ID认证成功', data)
    const res: PixivUser = {
      ...data.userData,
      PHPSESSID: sessionId ?? '',
      CSRFTOKEN: data.token,
    }
    return res
  } catch (err) {
    throw err
  }
}

export function userLogin(token: string): Promise<PixivUser> {
  if (!tokenValidator(token)) {
    console.error('访问令牌格式错误')
    return Promise.reject('访问令牌格式错误')
  }
  Cookies.set('PHPSESSID', token, {
    expires: 180,
    path: '/',
    secure: true,
  })
  return userInit()
}

export function userLogout(): void {
  const token = Cookies.get('PHPSESSID')
  if (token && confirm(`您要移除您的令牌吗？\n${token}`)) {
    Cookies.remove('PHPSESSID')
    Cookies.remove('CSRFTOKEN')
  }
}

export function tokenValidator(token: string): boolean {
  return /^\d{2,10}_[0-9A-Za-z]{32}$/.test(token)
}

export function tokenExample(): string {
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
