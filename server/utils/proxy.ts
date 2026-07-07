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
  if (DEV && body) {
    const [toClient, toLog] = body.tee()
    body = toClient
    void previewStream(toLog, opts.devLabel ?? 'proxy', upstream.status)
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
