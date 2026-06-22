import { type CheerioAPI, load } from 'cheerio'
import { pixivFetch } from '~~/server/utils/pixiv'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const cookies = parseCookies(event)
  const authHeader = getHeader(event, 'authorization') || ''
  const token =
    authHeader.replace(/^Bearer\s+/i, '') ||
    cookies.PHPSESSID ||
    (query.token as string)
  if (!token) {
    throw createError({ statusCode: 403, message: 'Missing user token' })
  }

  const { data, status } = await pixivFetch({
    event,
    url: '/',
    params: query,
  })

  if (status !== 200) {
    throw createError({ statusCode: status, data })
  }

  const $ = load(data)

  let meta: { userData: any; token: string }
  const $legacyGlobalMeta = $('meta[name="global-data"]')
  const $nextDataScript = $('script#__NEXT_DATA__')

  try {
    if ($legacyGlobalMeta.length > 0) {
      meta = resolveLegacyGlobalMeta($)
    } else if ($nextDataScript.length > 0) {
      meta = resolveNextData($)
    } else {
      throw new Error('Cannot resolve user data', {
        cause: {
          error: new TypeError('No valid resolver found'),
          meta: null,
        },
      })
    }
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      data: {
        message: error.message,
        cause: error.cause,
      },
    })
  }

  setResponseHeader(event, 'cache-control', 'no-cache')
  return meta
})

function resolveLegacyGlobalMeta($: CheerioAPI): {
  userData: any
  token: string
} {
  const $meta = $('meta[name="global-data"]')
  if ($meta.length === 0 || !$meta.attr('content')) {
    throw new Error('Invalid user token', {
      cause: {
        error: new TypeError('No global-data meta found'),
        meta: $meta.prop('outerHTML'),
      },
    })
  }

  let meta: any
  try {
    meta = JSON.parse($meta.attr('content') as string)
  } catch (error) {
    throw new Error('Error parsing user data', {
      cause: {
        error,
        meta: $meta.attr('content'),
      },
    })
  }

  if (!meta.userData) {
    throw new Error('Error resolving user data', {
      cause: {
        error: new TypeError('userData is not defined'),
        meta,
      },
    })
  }

  return {
    userData: meta.userData,
    token: meta.token || '',
  }
}

function resolveNextData($: CheerioAPI): {
  userData: any
  token: string
} {
  const $nextDataScript = $('script#__NEXT_DATA__')
  if ($nextDataScript.length === 0) {
    throw new Error('Error resolving user data', {
      cause: {
        error: new TypeError('No #__NEXT_DATA__ script found'),
        meta: null,
      },
    })
  }

  let nextData: any
  let perloadState: any
  try {
    nextData = JSON.parse($nextDataScript.text())
    perloadState = JSON.parse(
      nextData?.props?.pageProps?.serverSerializedPreloadedState
    )
  } catch (error) {
    throw new Error('Error parsing user data', {
      cause: {
        error,
        meta: $nextDataScript.text(),
      },
    })
  }

  const userData = perloadState?.userData?.self
  if (!userData) {
    throw new Error('Error resolving user data', {
      cause: {
        error: new TypeError('userData is not defined'),
        meta: nextData,
      },
    })
  }

  const token = perloadState?.api?.token || ''
  return { userData, token }
}
