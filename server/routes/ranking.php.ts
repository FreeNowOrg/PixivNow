export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params = (() => {
    const ret = ['format=json']
    for (const [k, v] of Object.entries(query)) {
      if (Array.isArray(v)) {
        ret.push(`${k}[]=${v.join(`&${k}[]=`)}`)
      } else {
        ret.push(`${k}=${v}`)
      }
    }
    return ret.join('&')
  })()
  const url = `https://www.pixiv.net/ranking.php?${params}`
  const res = await fetchWithEvent(event, url, {
    headers: {
      ...getProxyRequestHeaders(event),
      Origin: 'https://www.pixiv.net',
      Host: 'www.pixiv.net',
      Referer: 'https://www.pixiv.net/',
    },
  })
  const body = await res.text()
  const r = replaceUrl(body)
  for (const c of res.headers.getSetCookie()) {
    const nv = /^([^=]+)=([^;]+);/.exec(c) ?? []
    const age = /;\s[Mm]ax-[Aa]ge=(\d+)/.exec(c) ?? []
    const exp = /;\s[Ee]xpires=([^;]+)/.exec(c) ?? []
    setCookie(event, nv[1], nv[2], {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: age[1] ? +age[1] : undefined,
      expires: age[1] && !exp[1] ? undefined : new Date(exp[1]),
    })
  }
  return JSON.parse(r)
})
