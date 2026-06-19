import type { PixivUser } from '~/types'

const TOKEN_KEY = 'pixivnow:token'
const CSRF_KEY = 'pixivnow:csrf'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_KEY)
}

export function existsSessionId(): boolean {
  if (getToken()) {
    return true
  } else {
    sessionStorage.removeItem(CSRF_KEY)
    return false
  }
}

export async function initUser(): Promise<PixivUser> {
  const pixivClient = usePixivClient()
  try {
    const data = await pixivClient._getSessionUser()
    if (data.token) {
      console.log('session ID认证成功', data)
      sessionStorage.setItem(CSRF_KEY, data.token)
      return data.userData
    } else {
      sessionStorage.removeItem(CSRF_KEY)
      return Promise.reject('无效的session ID')
    }
  } catch (err) {
    sessionStorage.removeItem(CSRF_KEY)
    return Promise.reject(err)
  }
}

export function login(token: string): Promise<PixivUser> {
  if (!validateSessionId(token)) {
    console.error('访问令牌格式错误')
    return Promise.reject('访问令牌格式错误')
  }
  localStorage.setItem(TOKEN_KEY, token)
  return initUser()
}

export function logout(): void {
  const token = getToken()
  if (token && confirm(`您要移除您的令牌吗？\n${token}`)) {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(CSRF_KEY)
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
