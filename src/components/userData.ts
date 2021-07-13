import * as Cookies from 'js-cookie'
import axios from 'axios'
import { API_BASE } from '../config'
import { Ref, ref } from 'vue'

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
export const userData: Ref<PixivUser | null | undefined> = ref()

export async function userInit(): Promise<PixivUser | null> {
  const token = Cookies.get('PHPSESSID')
  if (!token) {
    userData.value = null
    throw { message: '令牌已丢失！' }
  }
  try {
    const { data } = await axios.get(`${API_BASE}/api/user`)
    console.log('访问令牌认证成功', data)
    const res = { ...data, PHPSESSID: token }
    userData.value = res
    return res as PixivUser
  } catch (err) {
    userData.value = null
    throw { message: '访问令牌可能失效' }
  }
}

export function userLogin(token: string) {
  if (!tokenValidator(token)) throw console.error('访问令牌格式错误')
  Cookies.set('PHPSESSID', token, {
    expires: 180,
    path: '/',
  })
  return userInit()
}

export function userLogout() {
  const token = Cookies.get('PHPSESSID')
  if (token && confirm(`您要移除您的令牌吗？\n${token}`)) {
    Cookies.remove('PHPSESSID')
    userData.value = null
  }
}

export function tokenValidator(token: string) {
  return /^\d{2,10}_.{32}$/.test(token)
}

export function tokenExample() {
  const uid = (99999999 * Math.random()).toFixed(0)
  const secret = (() => {
    const strSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
    let final = ''
    for (let i = 0; i < 32; i++) {
      const charIndex = Math.floor(Math.random() * strSet.length)
      final += strSet[charIndex]
    }
    return final
  })()
  return `${uid}_${secret}`
}
