import { VercelRequest, VercelResponse } from '@vercel/node'
import { CheerioAPI, load } from 'cheerio'
import { ajax, replacePximgUrlsInObject } from './utils.js'

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = req.cookies.PHPSESSID || req.query.token
  if (!token) {
    return res.status(403).send({ message: '未配置用户密钥' })
  }

  ajax
    .get('/', { params: req.query, headers: req.headers })
    .then(async ({ data }) => {
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
          throw new Error('未知的元数据类型', {
            cause: {
              error: new TypeError('No valid resolver found'),
              meta: null,
            },
          })
        }
      } catch (error: any) {
        return res.status(401).send({
          message: error.message,
          cause: error.cause,
        })
      }

      res.setHeader('cache-control', 'no-cache')
      res.setHeader(
        'set-cookie',
        `CSRFTOKEN=${meta.token}; path=/; secure; sameSite=Lax`
      )
      res.send(replacePximgUrlsInObject(meta))
    })
    .catch((err) => {
      return res
        .status(err?.response?.status || 500)
        .send(err?.response?.data || err)
    })
}

function resolveLegacyGlobalMeta($: CheerioAPI): {
  userData: any
  token: string
} {
  const $meta = $('meta[name="global-data"]')
  if ($meta.length === 0 || !$meta.attr('content')) {
    throw new Error('无效的用户密钥', {
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
    throw new Error('解析元数据时出错', {
      cause: {
        error,
        meta: $meta.attr('content'),
      },
    })
  }

  if (!meta.userData) {
    throw new Error('无法获取登录状态', {
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
    throw new Error('无法获取元数据', {
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
    throw new Error('解析元数据时出错', {
      cause: {
        error,
        meta: $nextDataScript.text(),
      },
    })
  }

  const userData = perloadState?.userData?.self
  if (!userData) {
    throw new Error('意料外的元数据', {
      cause: {
        error: new TypeError('userData is not defined'),
        meta: nextData,
      },
    })
  }

  const token = perloadState?.api?.token || ''
  return { userData, token }
}
