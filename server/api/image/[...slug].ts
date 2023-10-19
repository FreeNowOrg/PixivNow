export default defineEventHandler(async (event) => {
  const path = event.context.params?.slug ?? ''
  const reqHeaders = getProxyRequestHeaders(event)
  const url = `https://s.pximg.net/${path}`
  return proxyRequest(event, url, {
    headers: {
      Cookie: reqHeaders.Cookie,
      Host: 'www.pixiv.net',
      Origin: 'https://www.pixiv.net',
      Referer: 'https://www.pixiv.net/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0',
    },
    cookieDomainRewrite: {
      '.pixiv.net': '',
    },
  })
})
