import { formatInTimeZone } from 'date-fns-tz'
import { PXIMG_BASEURL_I, pixivAjax } from '~~/server/utils/pixiv'
import type { Artwork } from '~~/shared/types/Artworks'

type ArtworkOrAd = Artwork | { isAdContainer: boolean }

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reqHeaders = getHeaders(event)
  const requestImage =
    (reqHeaders.accept?.includes('image') || query.format === 'image') &&
    query.format !== 'json'

  try {
    const data: { illusts?: ArtworkOrAd[] } = (
      await pixivAjax({
        url: '/ajax/illust/discovery',
        params: {
          mode: query.mode ?? 'safe',
          max: requestImage ? '1' : ((query.max as string) ?? '18'),
        },
        headers: reqHeaders as Record<string, string>,
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
        mini: `${PXIMG_BASEURL_I}c/48x48/img-master/${middle}_p0_square1200.jpg`,
        thumb: `${PXIMG_BASEURL_I}c/250x250_80_a2/img-master/${middle}_p0_square1200.jpg`,
        small: `${PXIMG_BASEURL_I}c/540x540_70/img-master/${middle}_p0_master1200.jpg`,
        regular: `${PXIMG_BASEURL_I}img-master/${middle}_p0_master1200.jpg`,
        original: `${PXIMG_BASEURL_I}img-original/${middle}_p0.jpg`,
      }
    })

    if (requestImage) {
      const url = illusts[0]?.urls?.regular
      if (!url) {
        throw createError({ statusCode: 404, message: 'No image found' })
      }
      return sendRedirect(event, url)
    } else {
      return illusts
    }
  } catch (e: any) {
    throw createError({
      statusCode: e?.response?.status ?? 500,
      data: e?.response?.data ?? String(e),
    })
  }
})
