import { formatInTimeZone } from 'date-fns-tz'
import { ajax } from '../modules/http.js'
import { Artwork } from '../../src/types/Artworks.js'
import { EventContext } from '@cloudflare/workers-types'

type ArtworkOrAd = Artwork | { isAdContainer: boolean }

export async function onRequestGet(
  ctx: EventContext<any, any, any>
): Promise<Response> {
  const req = ctx.request
  const url = new URL(req.url)

  const requestImage =
    (req.headers.get('accept')?.includes('image') ||
      url.searchParams.get('format') === 'image') &&
    url.searchParams.get('format') !== 'json'

  try {
    const data: { illusts?: ArtworkOrAd[] } = (
      await ajax.get('/ajax/illust/discovery', {
        query: {
          mode: url.searchParams.get('mode') ?? 'safe',
          max: requestImage ? '1' : url.searchParams.get('max') ?? '18',
        },
        headers: Object.fromEntries(req.headers.entries()),
      })
    ).data
    const illusts = (data.illusts ?? []).filter((value): value is Artwork =>
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
    if (requestImage) {
      return Response.redirect(illusts[0].urls.original, 302)
    } else {
      return Response.json(illusts)
    }
  } catch (e: any) {
    return new Response('error', { status: 500 })
  }
}
