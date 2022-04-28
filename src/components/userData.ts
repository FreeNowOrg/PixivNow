import Cookies from 'js-cookie'
import { API_BASE } from '../config'
import { Ref, ref } from 'vue'
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
}

// userData
export const userData: Ref<PixivUser | null> = ref(null)

export async function userInit(): Promise<PixivUser | null> {
  const token = Cookies.get('PHPSESSID')
  if (!token) {
    Cookies.remove('CSRFTOKEN')
    userData.value = null
    console.warn('令牌已丢失！')
    return null
  }
  try {
    const data = await getJSON(`${API_BASE}/api/user`, {
      headers: {
        'cache-control': 'no-store',
      },
    })
    console.log('访问令牌认证成功', data)
    const res = { ...data.userData, PHPSESSID: token, CSRFTOKEN: data.token }
    userData.value = res
    return res as PixivUser
  } catch (err) {
    userData.value = null
    Cookies.remove('CSRFTOKEN')
    console.warn('访问令牌可能失效')
    return null
  }
}

export function userLogin(token: string): Promise<PixivUser | null> {
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
    userData.value = null
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
