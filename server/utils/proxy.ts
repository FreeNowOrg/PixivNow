import type { H3Event } from 'h3'
import colors from 'picocolors'
import { DEV, proxyAwareFetch } from '~~/server/utils/pixiv'

export interface ProxyPassOptions {
  url: string
  method: string
  headers: Record<string, string>
  body?: BodyInit | null
  responseHeaders: string[]
  signal?: AbortSignal
  devLabel?: string
}

const DEV_LOG_CAP = 8 * 1024
const DEV_PREVIEW_CHARS = 200

// Only text-like bodies are worth previewing; binary would just be console noise.
const TEXT_TYPE_RE =
  /^(text\/|application\/(json|xml|javascript|x-www-form-urlencoded)|application\/[\w.-]+\+(json|xml))/i

function isTextType(contentType: string): boolean {
  return TEXT_TYPE_RE.test(contentType)
}

function fmtSize(contentLength: string | null): string {
  const n = Number(contentLength)
  if (!contentLength || !Number.isFinite(n)) return 'unknown size'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export async function proxyPass(
  event: H3Event,
  opts: ProxyPassOptions
): Promise<Response> {
  let upstream: Response
  try {
    upstream = await proxyAwareFetch(opts.url, {
      method: opts.method,
      headers: opts.headers,
      body: opts.body ?? undefined,
      signal: opts.signal,
    })
  } catch (err: any) {
    console.error(
      `[proxyPass] upstream fetch failed: ${opts.url}`,
      err?.message ?? err
    )
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      data: String(err?.message ?? err),
    })
  }

  const headers = new Headers()
  for (const h of opts.responseHeaders) {
    const val = upstream.headers.get(h)
    if (val) headers.set(h, val)
  }

  let body = upstream.body
  if (DEV) {
    const label = opts.devLabel ?? 'proxy'
    const contentType = upstream.headers.get('content-type') ?? ''
    if (body && isTextType(contentType)) {
      // Text (JSON/HTML/...): tee one branch to log a short preview.
      const [toClient, toLog] = body.tee()
      body = toClient
      void previewStream(toLog, label, upstream.status)
    } else {
      // Binary or empty body: summarize instead of dumping bytes to the console.
      const size = fmtSize(upstream.headers.get('content-length'))
      const kind = contentType || 'Blob'
      console.info(
        colors.green(`[${label} ${upstream.status}]`),
        `[${kind} ${size}]`
      )
    }
  }

  return new Response(body, { status: upstream.status, headers })
}

async function previewStream(
  stream: ReadableStream<Uint8Array>,
  label: string,
  status: number
): Promise<void> {
  try {
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (total < DEV_LOG_CAP) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.byteLength
      }
    }
    void reader.cancel().catch(() => {})
    const merged = new Uint8Array(total)
    let off = 0
    for (const c of chunks) {
      merged.set(c, off)
      off += c.byteLength
    }
    const text = new TextDecoder().decode(merged).slice(0, DEV_PREVIEW_CHARS)
    console.info(colors.green(`[${label} ${status}]`), text)
  } catch {
    // ignore dev logging errors
  }
}
