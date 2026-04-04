import { formatInTimeZone } from 'date-fns-tz'

const PXIMG_I = 'https://i.pximg.net/'
const PXIMG_S = 'https://s.pximg.net/'

/**
 * Create a pximg URL replacer with the given proxy base URLs.
 */
export function createPximgReplacer(baseUrlI: string, baseUrlS: string) {
  function replacePximgUrl(str: string): string {
    if (!str.includes('pximg.net')) return str
    return str.replaceAll(PXIMG_I, baseUrlI).replaceAll(PXIMG_S, baseUrlS)
  }

  function replacePximgInObject<T>(obj: T): T {
    if (typeof obj === 'string') {
      return replacePximgUrl(obj) as unknown as T
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => replacePximgInObject(item)) as unknown as T
    }
    if (typeof obj === 'object' && obj !== null) {
      const ctor = (obj as any).constructor?.name?.toLowerCase()
      if (ctor && ['arraybuffer', 'blob', 'formdata'].includes(ctor)) {
        return obj
      }
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replacePximgInObject(value)
      }
      return result as T
    }
    return obj
  }

  return { replacePximgUrl, replacePximgInObject }
}

// Default replacer using runtimeConfig
function getDefaultBaseUrls() {
  try {
    const config = useRuntimeConfig()
    const i = config.public.pximgBaseUrlI as string
    const s = config.public.pximgBaseUrlS as string
    return {
      baseUrlI: i ? (i.endsWith('/') ? i : i + '/') : '/-/',
      baseUrlS: s ? (s.endsWith('/') ? s : s + '/') : '/~/',
    }
  } catch {
    // Fallback when runtimeConfig is not available
    return { baseUrlI: '/-/', baseUrlS: '/~/' }
  }
}

let _defaultReplacer: ReturnType<typeof createPximgReplacer> | null = null
function getDefaultReplacer() {
  if (!_defaultReplacer) {
    const { baseUrlI, baseUrlS } = getDefaultBaseUrls()
    _defaultReplacer = createPximgReplacer(baseUrlI, baseUrlS)
  }
  return _defaultReplacer
}

export function replacePximgUrl(str: string): string {
  return getDefaultReplacer().replacePximgUrl(str)
}
export function replacePximgInObject<T>(obj: T): T {
  return getDefaultReplacer().replacePximgInObject(obj)
}

// ── URL conversion utilities ─────────────────────────────────────────

// Regex to strip /c/{size}/ prefix
const SIZE_PREFIX_RE = /\/c\/[^/]+\//

// Filename suffix patterns
const SUFFIX_RE = /_(square1200|custom1200|master1200)\.(jpg|png|gif)$/
const MASTER_SUFFIX_RE = /_(square1200|custom1200)\.(jpg|png|gif)$/

/**
 * Derive regular quality URL from any quality level URL.
 *
 * 1. Strip /c/{size}/ prefix
 * 2. Normalize path segment to img-master
 * 3. Normalize filename suffix to _master1200
 */
export function toRegularUrl(imageUrl: string): string {
  let url = imageUrl.replace(SIZE_PREFIX_RE, '/')
  url = url.replace('/custom-thumb/', '/img-master/')
  url = url.replace(MASTER_SUFFIX_RE, '_master1200.$2')
  return url
}

/**
 * Derive original quality URL from any quality level URL.
 *
 * 1. Strip /c/{size}/ prefix
 * 2. Normalize path segment to img-original
 * 3. Remove filename suffix
 *
 * Note: actual file extension may differ; callers should handle 404.
 */
export function toOriginalUrl(imageUrl: string): string {
  let url = imageUrl.replace(SIZE_PREFIX_RE, '/')
  url = url.replace('/img-master/', '/img-original/')
  url = url.replace('/custom-thumb/', '/img-original/')
  url = url.replace(SUFFIX_RE, '.$2')
  return url
}

/**
 * Build all quality level URLs from artwork ID and update date.
 *
 * Note: always uses img-master for thumb (cannot reproduce custom-thumb).
 */
export function buildIllustUrls(
  illustId: string | number,
  updateDate: string,
  page: number = 0
): ArtworkUrls {
  const middle = `img/${formatInTimeZone(
    updateDate,
    'Asia/Tokyo',
    'yyyy/MM/dd/HH/mm/ss'
  )}/${illustId}_p${page}`
  return {
    mini: `${PXIMG_I}c/48x48/img-master/${middle}_square1200.jpg`,
    thumb: `${PXIMG_I}c/250x250_80_a2/img-master/${middle}_square1200.jpg`,
    small: `${PXIMG_I}c/540x540_70/img-master/${middle}_master1200.jpg`,
    regular: `${PXIMG_I}img-master/${middle}_master1200.jpg`,
    original: `${PXIMG_I}img-original/${middle}.jpg`,
  }
}
