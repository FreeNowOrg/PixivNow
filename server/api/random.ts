import { formatInTimeZone } from 'date-fns-tz'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reqHeaderAccept = getRequestHeader(event, 'Accept') ?? ''
  const requestingImage =
    (reqHeaderAccept.includes('image') || query.format === 'image') &&
    query.image !== 'json'
  const p = new URLSearchParams({
    mode: (query.mode as string) ?? 'safe',
    max: requestingImage ? '1' : ((query.max as string) ?? '8'),
  })
  const res = await fetch(`/ajax/illust/discovery?${p.toString()}`, {
    headers: {
      ...getProxyRequestHeaders(event),
      Origin: 'https://www.pixiv.net',
      Host: 'www.pixiv.net',
      Referer: 'https://www.pixiv.net/',
    },
  })
  const data: { body: { illusts: (Artwork | { isAdContainer: true })[] } } =
    await res.json()
  const illusts = (data.body.illusts ?? []).filter((value): value is Artwork =>
    Object.keys(value).includes('id')
  )
  illusts.forEach((value) => {
    const middle = `img/${formatInTimeZone(
      value.updateDate,
      'Asia/Tokyo',
      'yyyy/MM/dd/HH/mm/ss'
    )}/${value.id}`
    value.urls = {
      mini: `/-/c/48x48/img-master/${middle}_p0_square1200.jpg`,
      thumb: `/-/c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
      small: `/-/c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
      regular: `/-/img-master/${middle}_p0_master1200.jpg`,
      original: `/-/img-original/${middle}_p0.jpg`,
    }
  })
  if (requestingImage) {
    sendRedirect(event, illusts[0].urls.regular, 302)
  } else {
    return data
  }
})
