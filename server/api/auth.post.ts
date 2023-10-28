import { load } from 'cheerio'

export default defineEventHandler(async (event) => {
  const data: { method: string; params: Record<string, string> } = JSON.parse(
    await readBody(event)
  )
  const reqHeaders = getProxyRequestHeaders(event)
  switch (data.method) {
    case 'login': {
      if (!data.params.sessionId) {
        setResponseStatus(event, 400)
        return {
          message: 'no session id',
        }
      }
      const res = await fetchWithEvent(event, 'https://www.pixiv.net', {
        headers: {
          ...reqHeaders,
          Cookie: `PHPSESSID=${data.params.sessionId}; secure; sameSite=None; httpOnly; path=/; domain=.pixiv.net;`,
        },
      })
      const t = await res.text()
      const $ = load(t)
      const $meta = $('meta[name="global-data"]')
      if ($meta.length <= 0 || !$meta.attr('content')) {
        setResponseStatus(event, 400)
        return {
          message: 'invalid session id',
        }
      }
      let metadata = JSON.parse($meta.attr('content') ?? '{}')
      if (!metadata.userData) {
        setResponseStatus(event, 400)
        return {
          message: 'cannot get user data',
        }
      }
      setCookie(event, 'token', metadata.token, {
        secure: true,
        httpOnly: true,
      })
      delete metadata.token
      return JSON.parse(replaceUrl(JSON.stringify(metadata)))
    }
    case 'logout': {
      const sessionId = getCookie(event, 'PHPSESSID') ?? ''
      const token = getCookie(event, 'token') ?? ''
      setResponseStatus(event, 204)
      setCookie(event, 'PHPSESSID', sessionId, {
        secure: true,
        httpOnly: true,
        maxAge: 0,
      })
      setCookie(event, 'token', token, {
        secure: true,
        httpOnly: true,
        maxAge: 0,
      })
      return ''
    }
  }
})
