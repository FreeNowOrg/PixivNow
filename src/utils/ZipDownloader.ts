/**
 * ZipDownloader - 支持分片下载和缓存的 ZIP 文件下载器
 *
 * 使用示例：
 *
 * // 使用默认配置（128KB 分片，32KB 初始尾部抓取）
 * const downloader = new ZipDownloader('https://example.com/file.zip')
 *
 * // 自定义分片大小和尾部抓取策略
 * const downloader = new ZipDownloader('https://example.com/file.zip', {
 *   chunkSize: 256 * 1024,        // 256KB 分片
 *   initialTailSize: 16 * 1024,   // 16KB 初始尾部抓取
 *   maxTailSize: 128 * 1024,      // 128KB 最大尾部抓取
 *   timeoutMs: 10000,             // 10秒超时
 *   retries: 3,                   // 重试3次
 *   lruBytes: 32 * 1024 * 1024,   // 32MB 缓存
 *   parallelProbe: 4,             // 4个并发探测
 *   maxConcurrentRequests: 6,     // 最大6个并发请求
 *   tryDecompress: true,          // 尝试解压
 *   probeThreshold: 2048          // 2KB探测阈值，小于此大小的文件跳过探测
 * })
 *
 * // 获取文件列表
 * const overview = await downloader.getCentralDirectory()
 *
 * // 下载单个文件
 * const result = await downloader.downloadByIndex(0)
 * const fileData = result.bytes
 *
 * // 流式下载模式（从头开始下载整个zip，每完成一个文件就回调）
 * const result = await downloader.streamingDownload({
 *   onFileComplete: (entryWithData, info) => {
 *     console.log(`文件完成: ${entryWithData.fileName}`)
 *     console.log(`MIME类型: ${info.mimeType}`)
 *     console.log(`数据大小: ${entryWithData.data.length} 字节`)
 *     // 处理文件数据 entryWithData.data
 *   },
 *   onProgress: (downloaded, total) => {
 *     console.log(`下载进度: ${(downloaded / total * 100).toFixed(2)}%`)
 *   }
 * })
 */

// --------------------------- Types ---------------------------
export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export interface ZipDownloaderOptions {
  fetch?: FetchLike
  timeoutMs?: number
  retries?: number
  lruBytes?: number
  parallelProbe?: number
  maxConcurrentRequests?: number
  tryDecompress?: boolean
  chunkSize?: number
  initialTailSize?: number
  maxTailSize?: number
  debug?: boolean
  probeThreshold?: number // 探测阈值，小于此大小的文件将跳过探测
}

export interface ZipEntry {
  index: number
  fileName: string
  compressedSize: number
  uncompressedSize: number
  crc32: number
  compressionMethod: number // 0=store, 8=deflate
  generalPurposeBitFlag: number
  localHeaderOffset: number
  centralHeaderOffset: number
  requiresZip64: boolean
  mimeType?: string
}

export interface ZipEntryWithData extends ZipEntry {
  data: Uint8Array
}

export interface ZipOverview {
  url: string
  contentLength: number
  centralDirectoryOffset: number
  centralDirectorySize: number
  entryCount: number
  entries: ZipEntry[]
}

export interface DataRange {
  index: number
  fileName: string
  dataStart: number
  dataLength: number
}

// ----------------------- Small utilities -----------------------
const TEXT_DECODER = new TextDecoder()

const SIG = {
  EOCD: 0x06054b50,
  ZIP64_EOCD_LOCATOR: 0x07064b50,
  ZIP64_EOCD: 0x06064b50,
  CD_FILE_HEADER: 0x02014b50,
  LOCAL_FILE_HEADER: 0x04034b50,
} as const

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

class ConcurrencyLimiter {
  private running = 0
  private q: Array<() => void> = []
  constructor(private max: number) {}
  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++
      return
    }
    return new Promise((res) => this.q.push(res))
  }
  release() {
    this.running--
    if (this.q.length) {
      this.running++
      this.q.shift()!()
    }
  }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

class ByteLRU {
  private map = new Map<string, Uint8Array>()
  private total = 0
  constructor(private maxBytes: number) {}
  get(k: string) {
    const v = this.map.get(k)
    if (!v) return
    this.map.delete(k)
    this.map.set(k, v)
    return v
  }
  set(k: string, v: Uint8Array) {
    if (v.byteLength > this.maxBytes) return
    const old = this.map.get(k)
    if (old) {
      this.total -= old.byteLength
      this.map.delete(k)
    }
    this.map.set(k, v)
    this.total += v.byteLength
    while (this.total > this.maxBytes && this.map.size) {
      const [oldK, oldV] = this.map.entries().next().value as [
        string,
        Uint8Array,
      ]
      this.map.delete(oldK)
      this.total -= oldV.byteLength
    }
  }
  resize(n: number) {
    this.maxBytes = n
    while (this.total > this.maxBytes && this.map.size) {
      const [k, v] = this.map.entries().next().value!
      this.map.delete(k)
      this.total -= v.byteLength
    }
  }
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

async function withRetries<T>(
  fn: () => Promise<T>,
  retries: number,
  baseDelay = 200
): Promise<T> {
  let n = 0
  for (;;) {
    try {
      return await fn()
    } catch (e) {
      if (n++ >= retries) {
        console.error(
          `[ZipDownloader] 重试失败，已达到最大重试次数 ${retries}:`,
          e
        )
        throw e
      }
      const delay = baseDelay * 2 ** (n - 1) * (1 + Math.random() * 0.2)
      console.warn(
        `[ZipDownloader] 请求失败，${delay.toFixed(0)}ms 后重试 (${n}/${retries}):`,
        e
      )
      await sleep(delay)
    }
  }
}

function withTimeout<T>(p: Promise<T>, ms?: number): Promise<T> {
  if (!ms || ms <= 0) return p
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

function findSignatureFromEnd(buf: Uint8Array, signature: number): number {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  for (let i = buf.byteLength - 4; i >= 0; i--)
    if (dv.getUint32(i, true) === signature) return i
  return -1
}

function readAscii(dv: DataView, offset: number, length: number): string {
  return TEXT_DECODER.decode(
    new Uint8Array(dv.buffer, dv.byteOffset + offset, length)
  )
}

// -------------------- MIME detection (lean) --------------------
const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
  csv: 'text/csv',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  exe: 'application/x-msdownload',
  dmg: 'application/x-apple-diskimage',
  iso: 'application/x-iso9660-image',
}

function getMimeTypeFromExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext
    ? MIME_TYPES[ext] || 'application/octet-stream'
    : 'application/octet-stream'
}

function getMimeFromMagic(u8: Uint8Array): string {
  if (u8.length < 4) return 'application/octet-stream'
  const h = Array.from(u8.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  if (h.startsWith('89504e470d0a1a0a')) return 'image/png'
  if (h.startsWith('ffd8ff')) return 'image/jpeg'
  if (h.startsWith('47494638')) return 'image/gif'
  if (h.startsWith('25504446')) return 'application/pdf'
  if (
    h.startsWith('504b0304') ||
    h.startsWith('504b0506') ||
    h.startsWith('504b0708')
  )
    return 'application/zip'
  // webp/wav quick checks
  if (h.startsWith('52494646') && u8.length >= 12) {
    const tag = String.fromCharCode(...u8.slice(8, 12))
    if (tag === 'WEBP') return 'image/webp'
    if (tag === 'WAVE') return 'audio/wav'
  }
  // mp4 ftyp
  if (u8.length >= 8) {
    const size = new DataView(u8.buffer, u8.byteOffset, 4).getUint32(0, false)
    if (size >= 8 && u8.length >= size) {
      const type = new TextDecoder().decode(u8.slice(4, 8))
      if (type === 'ftyp') return 'video/mp4'
    }
  }
  return 'application/octet-stream'
}

function getMimeType(fileName: string, data?: Uint8Array): string {
  if (data && data.length) {
    const m = getMimeFromMagic(data)
    if (m !== 'application/octet-stream') return m
  }
  return getMimeTypeFromExtension(fileName)
}

// -------------------- Decompression helper --------------------
async function maybeDecompress(
  method: number,
  data: Uint8Array,
  tryDecompress: boolean
): Promise<{ bytes: Uint8Array; isDecompressed: boolean; method: number }> {
  if (!tryDecompress) {
    console.log(
      `[ZipDownloader] 跳过解压 (方法: ${method}, 数据大小: ${data.length})`
    )
    return { bytes: data, isDecompressed: false, method }
  }
  if (method === 0) {
    console.log(`[ZipDownloader] 无需解压 (存储方法, 数据大小: ${data.length})`)
    return { bytes: data, isDecompressed: true, method }
  }
  const DS: any = (globalThis as any).DecompressionStream
  if (method === 8 && typeof DS === 'function') {
    console.log(
      `[ZipDownloader] 开始解压 (Deflate方法, 原始大小: ${data.length})`
    )
    const ds = new DS('deflate-raw')
    const res = new Response(
      new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(ds)
    )
    const ab = await res.arrayBuffer()
    const decompressed = new Uint8Array(ab)
    console.log(
      `[ZipDownloader] 解压完成 (解压后大小: ${decompressed.length}, 压缩比: ${((data.length / decompressed.length) * 100).toFixed(1)}%)`
    )
    return { bytes: decompressed, isDecompressed: true, method }
  }
  console.log(`[ZipDownloader] 不支持的压缩方法: ${method}, 返回原始数据`)
  return { bytes: data, isDecompressed: false, method }
}

// -------------------- Networking layer --------------------
class RangeRequestManager {
  private inflight = new Map<string, Promise<Uint8Array>>()
  constructor(
    private url: string,
    private fetcher: FetchLike,
    private timeoutMs: number,
    private retries: number,
    private limiter: ConcurrencyLimiter,
    private cache: ByteLRU
  ) {}

  setUrl(url: string) {
    this.url = url
    this.inflight.clear()
  }
  setTimeout(ms: number) {
    this.timeoutMs = ms
  }
  setRetries(n: number) {
    this.retries = n
  }
  setLimiter(l: ConcurrencyLimiter) {
    this.limiter = l
  }
  setCache(c: ByteLRU) {
    this.cache = c
  }

  async headSize(signal?: AbortSignal): Promise<number> {
    const doHead = async () => {
      const res = await withTimeout(
        this.fetcher(this.url, { method: 'HEAD', signal }),
        this.timeoutMs
      )
      if (!res.ok) throw new Error(`HEAD ${res.status}`)
      const len = res.headers.get('content-length')
      if (!len) throw new Error('Missing content-length')
      const n = Number(len)
      if (!Number.isFinite(n) || n < 0)
        throw new Error(`Bad content-length: ${len}`)
      return n
    }
    const doRange = async () => {
      const res = await withTimeout(
        this.fetcher(this.url, { headers: { Range: 'bytes=0-0' }, signal }),
        this.timeoutMs
      )
      const cr = res.headers.get('content-range')
      if (!cr) throw new Error('Missing content-range')
      const m = cr.match(/\/(\d+)$/)
      if (!m) throw new Error(`Bad content-range: ${cr}`)
      return Number(m[1])
    }
    return withRetries(async () => {
      try {
        return await doHead()
      } catch {
        return await doRange()
      }
    }, this.retries)
  }

  async range(
    start: number,
    end: number,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const cacheKey = `r:${start}-${end}`
    const hit = this.cache.get(cacheKey)
    if (hit) {
      console.log(
        `[ZipDownloader] 缓存命中: ${start}-${end} (${hit.length} 字节)`
      )
      return hit
    }

    const inflightKey = `f:${start}-${end}`
    if (!this.inflight.has(inflightKey)) {
      console.log(`[ZipDownloader] 开始下载范围: ${start}-${end}`)
      this.inflight.set(
        inflightKey,
        this.limiter
          .run(async () => {
            const res = await withRetries(async () => {
              const r = await withTimeout(
                this.fetcher(this.url, {
                  headers: { Range: `bytes=${start}-${end}` },
                  signal,
                }),
                this.timeoutMs
              )
              if (!(r.status === 206 || r.status === 200))
                throw new Error(`HTTP ${r.status} for ${start}-${end}`)
              return r
            }, this.retries)
            const u8 = new Uint8Array(await res.arrayBuffer())
            this.cache.set(cacheKey, u8)
            console.log(
              `[ZipDownloader] 范围下载完成: ${start}-${end} (${u8.length} 字节)`
            )
            return u8
          })
          .catch((err) => {
            console.error(`[ZipDownloader] 范围下载失败: ${start}-${end}`, err)
            this.inflight.delete(inflightKey)
            throw err
          })
      )
    } else {
      console.log(`[ZipDownloader] 等待进行中的请求: ${start}-${end}`)
    }
    return this.inflight.get(inflightKey)!
  }
}

// ------------------------ ZIP parsing ------------------------
class ZipParser {
  constructor(
    private rangeHelper: RangeRequestManager,
    private opts: Required<
      Pick<
        ZipDownloaderOptions,
        'initialTailSize' | 'maxTailSize' | 'chunkSize'
      >
    > & { tryDecompress: boolean }
  ) {}

  async overview(signal?: AbortSignal, url?: string): Promise<ZipOverview> {
    console.log('[ZipDownloader] 开始解析ZIP文件概览...')
    const contentLength = await this.rangeHelper.headSize(signal)

    // progressive tail fetch
    let tailSize = Math.min(this.opts.initialTailSize, contentLength)
    let tailStart = contentLength - tailSize
    console.log(
      `[ZipDownloader] 初始尾部抓取: ${tailSize} 字节 (从位置 ${tailStart})`
    )
    let tail = await this.rangeHelper.range(
      tailStart,
      contentLength - 1,
      signal
    )
    let eocdPos = findSignatureFromEnd(tail, SIG.EOCD)

    while (eocdPos === -1 && tailSize < contentLength) {
      const newTailSize = Math.min(
        tailSize + this.opts.initialTailSize,
        this.opts.maxTailSize,
        contentLength
      )
      if (newTailSize === tailSize) break
      console.log(
        `[ZipDownloader] EOCD未找到，扩展尾部抓取: ${tailSize} -> ${newTailSize} 字节`
      )
      tailSize = newTailSize
      tailStart = contentLength - tailSize
      tail = await this.rangeHelper.range(tailStart, contentLength - 1, signal)
      eocdPos = findSignatureFromEnd(tail, SIG.EOCD)
    }
    if (eocdPos === -1) {
      console.error('[ZipDownloader] 未找到EOCD签名')
      throw new Error('EOCD not found')
    }
    console.log(`[ZipDownloader] 找到EOCD签名，位置: ${eocdPos}`)

    const tailDV = new DataView(tail.buffer, tail.byteOffset, tail.byteLength)
    let cdCount = tailDV.getUint16(eocdPos + 10, true)
    let cdSize = tailDV.getUint32(eocdPos + 12, true)
    let cdOffset = tailDV.getUint32(eocdPos + 16, true)

    console.log(
      `[ZipDownloader] EOCD信息: 文件数=${cdCount}, 目录大小=${cdSize}, 目录偏移=${cdOffset}`
    )

    const needsZip64 =
      cdCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff
    if (needsZip64) {
      console.log('[ZipDownloader] 检测到ZIP64格式，解析ZIP64头部...')
      const locPos = findSignatureFromEnd(tail, SIG.ZIP64_EOCD_LOCATOR)
      if (locPos === -1) {
        console.error('[ZipDownloader] 未找到ZIP64定位器')
        throw new Error('ZIP64 locator missing')
      }
      const z64Off = Number(tailDV.getBigUint64(locPos + 8, true))
      console.log(`[ZipDownloader] ZIP64头部偏移: ${z64Off}`)
      const z64Hdr = await this.rangeHelper.range(
        z64Off,
        z64Off + 160 - 1,
        signal
      )
      const dv = new DataView(
        z64Hdr.buffer,
        z64Hdr.byteOffset,
        z64Hdr.byteLength
      )
      if (dv.getUint32(0, true) !== SIG.ZIP64_EOCD) {
        console.error('[ZipDownloader] ZIP64 EOCD签名不匹配')
        throw new Error('ZIP64 EOCD signature mismatch')
      }
      cdCount = Number(dv.getBigUint64(32, true))
      cdSize = Number(dv.getBigUint64(40, true))
      cdOffset = Number(dv.getBigUint64(48, true))
      console.log(
        `[ZipDownloader] ZIP64信息: 文件数=${cdCount}, 目录大小=${cdSize}, 目录偏移=${cdOffset}`
      )
    }

    // 检查中央目录是否已经在尾部数据中
    const cdStart = cdOffset - tailStart
    const cdEnd = cdStart + cdSize
    let cdBuf: Uint8Array

    if (cdStart >= 0 && cdEnd <= tail.byteLength) {
      // 中央目录完全包含在尾部数据中，直接提取
      console.log(
        `[ZipDownloader] 中央目录已在尾部数据中，直接提取: ${cdOffset}-${cdOffset + cdSize - 1} (${cdSize} 字节)`
      )
      cdBuf = tail.subarray(cdStart, cdEnd)
    } else {
      // 中央目录不在尾部数据中，需要下载
      console.log(
        `[ZipDownloader] 下载中央目录: ${cdOffset}-${cdOffset + cdSize - 1} (${cdSize} 字节)`
      )
      cdBuf = await this.rangeHelper.range(
        cdOffset,
        cdOffset + cdSize - 1,
        signal
      )
    }
    const cdDV = new DataView(cdBuf.buffer, cdBuf.byteOffset, cdBuf.byteLength)

    console.log(`[ZipDownloader] 开始解析 ${cdCount} 个文件条目...`)
    const entries: ZipEntry[] = []
    for (let p = 0, i = 0; p < cdBuf.byteLength && i < cdCount; i++) {
      if (cdDV.getUint32(p, true) !== SIG.CD_FILE_HEADER) break
      const flags = cdDV.getUint16(p + 8, true)
      const method = cdDV.getUint16(p + 10, true)
      const crc32 = cdDV.getUint32(p + 16, true)
      const comp32 = cdDV.getUint32(p + 20, true)
      const uncomp32 = cdDV.getUint32(p + 24, true)
      const fnLen = cdDV.getUint16(p + 28, true)
      const extraLen = cdDV.getUint16(p + 30, true)
      const cmtLen = cdDV.getUint16(p + 32, true)
      const lho32 = cdDV.getUint32(p + 42, true)
      const name = readAscii(cdDV, p + 46, fnLen)

      let compressedSize = comp32
      let uncompressedSize = uncomp32
      let localHeaderOffset = lho32
      let requiresZip64 = false

      const extraStart = p + 46 + fnLen
      const extra = new DataView(
        cdBuf.buffer,
        cdBuf.byteOffset + extraStart,
        extraLen
      )
      for (let ep = 0; ep + 4 <= extraLen; ) {
        const id = extra.getUint16(ep, true)
        const size = extra.getUint16(ep + 2, true)
        const s = ep + 4
        if (id === 0x0001) {
          // ZIP64
          requiresZip64 = true
          let z = s
          if (uncompressedSize === 0xffffffff && z + 8 <= s + size) {
            uncompressedSize = Number(extra.getBigUint64(z, true))
            z += 8
          }
          if (compressedSize === 0xffffffff && z + 8 <= s + size) {
            compressedSize = Number(extra.getBigUint64(z, true))
            z += 8
          }
          if (localHeaderOffset === 0xffffffff && z + 8 <= s + size) {
            localHeaderOffset = Number(extra.getBigUint64(z, true))
            z += 8
          }
        }
        ep += 4 + size
      }

      entries.push({
        index: i,
        fileName: name,
        compressedSize,
        uncompressedSize,
        crc32,
        compressionMethod: method,
        generalPurposeBitFlag: flags,
        localHeaderOffset,
        centralHeaderOffset: cdOffset + p,
        requiresZip64,
        mimeType: getMimeTypeFromExtension(name),
      })

      p = extraStart + extraLen + cmtLen
    }

    console.log(
      `[ZipDownloader] ZIP概览解析完成: ${entries.length} 个文件，总大小 ${contentLength} 字节`
    )

    return {
      url: url ?? '',
      contentLength,
      centralDirectoryOffset: cdOffset,
      centralDirectorySize: cdSize,
      entryCount: entries.length,
      entries,
    }
  }

  async probeLocalHeader(
    entry: ZipEntry,
    signal?: AbortSignal
  ): Promise<DataRange> {
    console.log(
      `[ZipDownloader] 探测本地头部: ${entry.fileName} (索引 ${entry.index})`
    )

    // 对于小文件，使用更小的探测范围以减少不必要的下载
    const probeSize = Math.min(30 + 256, 30 + this.opts.chunkSize) // 最多只探测286字节
    const probe = await this.rangeHelper.range(
      entry.localHeaderOffset,
      entry.localHeaderOffset + probeSize - 1,
      signal
    )
    const dv = new DataView(probe.buffer, probe.byteOffset, probe.byteLength)
    if (dv.getUint32(0, true) !== SIG.LOCAL_FILE_HEADER) {
      console.error(
        `[ZipDownloader] 本地头部签名不匹配: ${entry.localHeaderOffset}`
      )
      throw new Error(
        `Local header signature mismatch at ${entry.localHeaderOffset}`
      )
    }
    const fnLen = dv.getUint16(26, true)
    const extraLen = dv.getUint16(28, true)
    const dataStart = entry.localHeaderOffset + 30 + fnLen + extraLen
    console.log(
      `[ZipDownloader] 本地头部探测完成: ${entry.fileName}, 数据开始位置: ${dataStart}, 数据长度: ${entry.compressedSize}`
    )
    return {
      index: entry.index,
      fileName: entry.fileName,
      dataStart,
      dataLength: entry.compressedSize,
    }
  }
}

// ---------------------- Public class ----------------------
export class ZipDownloader {
  private opts: Required<ZipDownloaderOptions>
  private cache: ByteLRU
  private limiter: ConcurrencyLimiter
  private rangeHelper: RangeRequestManager
  private parser: ZipParser

  private inflight = new Map<string, Promise<any>>()
  private overview?: ZipOverview
  private dataRanges?: DataRange[]
  private pathToIndex = new Map<string, number>()

  constructor(
    private url: string,
    options: ZipDownloaderOptions = {}
  ) {
    this.opts = {
      fetch: options.fetch ?? fetch.bind(globalThis),
      timeoutMs: options.timeoutMs ?? 15000,
      retries: options.retries ?? 2,
      lruBytes: options.lruBytes ?? 16 * 1024 * 1024,
      parallelProbe: options.parallelProbe ?? 4,
      maxConcurrentRequests: options.maxConcurrentRequests ?? 6,
      tryDecompress: options.tryDecompress ?? true,
      chunkSize: options.chunkSize ?? 128 * 1024,
      initialTailSize: options.initialTailSize ?? 16 * 1024,
      maxTailSize: options.maxTailSize ?? 128 * 1024,
      debug: options.debug ?? false,
      probeThreshold: options.probeThreshold ?? 1024, // 默认1KB阈值
    }

    if (this.opts.debug) {
      console.log('[ZipDownloader] 初始化配置:', {
        url: this.url,
        timeoutMs: this.opts.timeoutMs,
        retries: this.opts.retries,
        lruBytes: this.opts.lruBytes,
        parallelProbe: this.opts.parallelProbe,
        maxConcurrentRequests: this.opts.maxConcurrentRequests,
        tryDecompress: this.opts.tryDecompress,
        chunkSize: this.opts.chunkSize,
        initialTailSize: this.opts.initialTailSize,
        maxTailSize: this.opts.maxTailSize,
      })
    }
    this.cache = new ByteLRU(this.opts.lruBytes)
    this.limiter = new ConcurrencyLimiter(this.opts.maxConcurrentRequests)
    this.rangeHelper = new RangeRequestManager(
      this.url,
      this.opts.fetch,
      this.opts.timeoutMs,
      this.opts.retries,
      this.limiter,
      this.cache
    )
    this.parser = new ZipParser(this.rangeHelper, {
      initialTailSize: this.opts.initialTailSize,
      maxTailSize: this.opts.maxTailSize,
      chunkSize: this.opts.chunkSize,
      tryDecompress: this.opts.tryDecompress,
    })
  }

  setOptions(partial: ZipDownloaderOptions): this {
    if (this.opts.debug) {
      console.log('[ZipDownloader] 更新配置:', partial)
    }

    const next: Mutable<Required<ZipDownloaderOptions>> = {
      ...this.opts,
      ...partial,
      fetch: partial.fetch ?? this.opts.fetch,
    }
    const changedConcurrency =
      next.maxConcurrentRequests !== this.opts.maxConcurrentRequests
    const changedLRU = next.lruBytes !== this.opts.lruBytes

    this.opts = next

    if (changedLRU) {
      if (this.opts.debug) {
        console.log('[ZipDownloader] 调整缓存大小:', this.opts.lruBytes)
      }
      this.cache.resize(this.opts.lruBytes)
    }
    if (changedConcurrency) {
      if (this.opts.debug) {
        console.log(
          '[ZipDownloader] 调整并发限制:',
          this.opts.maxConcurrentRequests
        )
      }
      this.limiter = new ConcurrencyLimiter(this.opts.maxConcurrentRequests)
      this.rangeHelper.setLimiter(this.limiter)
    }

    this.rangeHelper.setTimeout(this.opts.timeoutMs)
    this.rangeHelper.setRetries(this.opts.retries)
    this.parser = new ZipParser(this.rangeHelper, {
      initialTailSize: this.opts.initialTailSize,
      maxTailSize: this.opts.maxTailSize,
      chunkSize: this.opts.chunkSize,
      tryDecompress: this.opts.tryDecompress,
    })
    return this
  }

  async getSize(signal?: AbortSignal): Promise<number> {
    const k = 'size'
    if (!this.inflight.has(k))
      this.inflight.set(
        k,
        this.rangeHelper.headSize(signal).catch((e) => {
          this.inflight.delete(k)
          throw e
        })
      )
    return this.inflight.get(k)!
  }

  async getCentralDirectory(signal?: AbortSignal): Promise<ZipOverview> {
    if (this.overview) {
      console.log('[ZipDownloader] 使用缓存的中央目录')
      return this.overview
    }
    const k = 'overview'
    if (!this.inflight.has(k)) {
      console.log('[ZipDownloader] 开始获取中央目录...')
      this.inflight.set(
        k,
        this.parser
          .overview(signal, this.url)
          .then((ov) => {
            this.overview = { ...ov, url: this.url }
            ov.entries.forEach((e) => this.pathToIndex.set(e.fileName, e.index))
            console.log(
              `[ZipDownloader] 中央目录获取完成: ${ov.entryCount} 个文件`
            )
            return this.overview!
          })
          .catch((e) => {
            console.error('[ZipDownloader] 中央目录获取失败:', e)
            this.inflight.delete(k)
            throw e
          })
      )
    } else {
      console.log('[ZipDownloader] 等待进行中的中央目录请求...')
    }
    return this.inflight.get(k)!
  }

  async downloadByIndex(index: number, signal?: AbortSignal) {
    console.log(`[ZipDownloader] 开始下载文件 (索引: ${index})`)
    const ov = await this.getCentralDirectory(signal)
    if (index < 0 || index >= ov.entryCount) {
      console.error(
        `[ZipDownloader] 索引超出范围: ${index} (范围: 0-${ov.entryCount - 1})`
      )
      throw new Error(`index out of range: ${index}`)
    }
    const e = ov.entries[index]
    console.log(
      `[ZipDownloader] 下载文件: ${e.fileName} (压缩大小: ${e.compressedSize}, 未压缩大小: ${e.uncompressedSize})`
    )
    const ranges = await this._ensureDataRanges(signal)
    const r = ranges[index]
    const key = `entry:${index}:${r.dataStart}-${r.dataLength}`

    if (!this.inflight.has(key)) {
      this.inflight.set(
        key,
        (async () => {
          console.log(
            `[ZipDownloader] 下载文件数据: ${e.fileName} (范围: ${r.dataStart}-${r.dataStart + r.dataLength - 1})`
          )
          const body = await this.rangeHelper.range(
            r.dataStart,
            r.dataStart + r.dataLength - 1,
            signal
          )
          console.log(
            `[ZipDownloader] 开始解压: ${e.fileName} (方法: ${e.compressionMethod})`
          )
          const { bytes, isDecompressed, method } = await maybeDecompress(
            e.compressionMethod,
            body,
            this.opts.tryDecompress
          )
          const mimeTypeFromExtension = getMimeTypeFromExtension(e.fileName)
          const mimeType = getMimeType(e.fileName, bytes)
          console.log(
            `[ZipDownloader] 文件下载完成: ${e.fileName} (${bytes.length} 字节, MIME: ${mimeType}, 解压: ${isDecompressed})`
          )
          return {
            fileName: e.fileName,
            index: e.index,
            bytes,
            isDecompressed,
            method,
            compressedSize: e.compressedSize,
            uncompressedSize: e.uncompressedSize,
            mimeType,
            mimeTypeFromExtension,
          }
        })().catch((err) => {
          console.error(`[ZipDownloader] 文件下载失败: ${e.fileName}`, err)
          this.inflight.delete(key)
          throw err
        })
      )
    } else {
      console.log(`[ZipDownloader] 等待进行中的文件下载: ${e.fileName}`)
    }
    return this.inflight.get(key)!
  }

  async downloadByPath(path: string, signal?: AbortSignal) {
    console.log(`[ZipDownloader] 通过路径下载文件: ${path}`)
    const ov = await this.getCentralDirectory(signal)
    const idx =
      this.pathToIndex.get(path) ??
      ov.entries.find((e) => e.fileName === path)?.index
    if (idx == null) {
      console.error(`[ZipDownloader] 文件未找到: ${path}`)
      throw new Error(`file not found in zip: ${path}`)
    }
    console.log(`[ZipDownloader] 找到文件索引: ${path} -> ${idx}`)
    return this.downloadByIndex(idx, signal)
  }

  private async _ensureDataRanges(signal?: AbortSignal): Promise<DataRange[]> {
    if (this.dataRanges) {
      console.log('[ZipDownloader] 使用缓存的数据范围')
      return this.dataRanges
    }
    const k = 'ranges'
    if (!this.inflight.has(k)) {
      console.log('[ZipDownloader] 开始探测数据范围...')
      this.inflight.set(
        k,
        (async () => {
          const ov = await this.getCentralDirectory(signal)
          const out: DataRange[] = new Array(ov.entryCount)

          // 智能探测：只对需要精确探测的文件进行探测
          const needsProbe: number[] = []
          const skipProbe: number[] = []

          for (let i = 0; i < ov.entries.length; i++) {
            const entry = ov.entries[i]
            // 对于小文件或压缩文件，跳过探测，使用默认范围
            if (
              entry.compressedSize < this.opts.probeThreshold ||
              entry.compressionMethod !== 0
            ) {
              skipProbe.push(i)
              out[i] = {
                index: entry.index,
                fileName: entry.fileName,
                dataStart: entry.localHeaderOffset + 30,
                dataLength: entry.compressedSize,
              }
            } else {
              needsProbe.push(i)
            }
          }

          console.log(
            `[ZipDownloader] 智能探测: ${skipProbe.length} 个文件跳过探测, ${needsProbe.length} 个文件需要探测`
          )

          if (needsProbe.length > 0) {
            const limit = Math.min(
              this.opts.parallelProbe,
              this.opts.maxConcurrentRequests
            )
            console.log(
              `[ZipDownloader] 使用并发限制: ${limit}, 批处理大小: ${Math.min(limit, 8)}`
            )
            const sem = new ConcurrencyLimiter(limit)
            const batchSize = Math.min(limit, 8)

            for (let i = 0; i < needsProbe.length; i += batchSize) {
              const batch = needsProbe.slice(i, i + batchSize)
              console.log(
                `[ZipDownloader] 处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(needsProbe.length / batchSize)}: ${batch.length} 个文件`
              )
              await Promise.all(
                batch.map((idx) =>
                  sem.run(async () => {
                    out[idx] = await this.parser.probeLocalHeader(
                      ov.entries[idx],
                      signal
                    )
                  })
                )
              )
            }
          }

          // 确保所有条目都有数据范围
          for (let j = 0; j < out.length; j++) {
            if (!out[j]) {
              const e = ov.entries[j]
              console.log(`[ZipDownloader] 使用默认数据范围: ${e.fileName}`)
              out[j] = {
                index: e.index,
                fileName: e.fileName,
                dataStart: e.localHeaderOffset + 30,
                dataLength: e.compressedSize,
              }
            }
          }

          this.dataRanges = out
          console.log(`[ZipDownloader] 数据范围探测完成: ${out.length} 个文件`)
          return out
        })().catch((e) => {
          console.error('[ZipDownloader] 数据范围探测失败:', e)
          this.inflight.delete(k)
          throw e
        })
      )
    } else {
      console.log('[ZipDownloader] 等待进行中的数据范围探测...')
    }
    return this.inflight.get(k)!
  }

  cleanup() {
    console.log('[ZipDownloader] 开始清理资源...')
    this.inflight.clear()
    this.cache = new ByteLRU(this.opts.lruBytes)
    this.limiter = new ConcurrencyLimiter(this.opts.maxConcurrentRequests)
    this.rangeHelper.setCache(this.cache)
    this.rangeHelper.setLimiter(this.limiter)
    this.overview = undefined
    this.dataRanges = undefined
    this.pathToIndex.clear()
    console.log('[ZipDownloader] 资源清理完成')
    return this
  }

  setUrl(url: string) {
    if (this.url !== url) {
      console.log(`[ZipDownloader] 更新URL: ${this.url} -> ${url}`)
      this.url = url
      this.rangeHelper.setUrl(url)
      this.cleanup()
    } else {
      console.log('[ZipDownloader] URL未变化，跳过更新')
    }
    return this
  }

  async getDataRanges(signal?: AbortSignal) {
    return this._ensureDataRanges(signal)
  }

  async streamingDownload(params: {
    onFileComplete?: (
      entry: ZipEntryWithData,
      info: {
        downloadTime: number
        method: number
        isDecompressed: boolean
        mimeType: string
        physicalIndex: number
      }
    ) => void
    onProgress?: (downloaded: number, total: number) => void
    chunkSize?: number
    signal?: AbortSignal
  }): Promise<{
    totalFiles: number
    completedFiles: number
    entries: ZipEntryWithData[]
  }> {
    const {
      onFileComplete,
      onProgress,
      chunkSize = this.opts.chunkSize,
      signal,
    } = params
    const t0 = performance.now()
    console.log(`[ZipDownloader] 开始流式下载 (块大小: ${chunkSize})`)
    const ov = await this.getCentralDirectory(signal)

    const sorted = ov.entries
      .filter((e) => e.compressedSize > 0)
      .sort((a, b) => a.localHeaderOffset - b.localHeaderOffset)
    console.log(
      `[ZipDownloader] 流式下载: ${sorted.length} 个有效文件，总大小: ${ov.contentLength} 字节`
    )
    if (sorted.length === 0) {
      console.log('[ZipDownloader] 没有可下载的文件')
      return { totalFiles: 0, completedFiles: 0, entries: [] }
    }

    const chunks: { start: number; end: number; data: Uint8Array }[] = []
    const extractRange = (start: number, length: number) => {
      const out = new Uint8Array(length)
      let written = 0,
        cursor = start
      for (const c of chunks) {
        if (c.end < cursor) continue
        if (c.start > start + length - 1) break
        const s = Math.max(c.start, cursor)
        const e = Math.min(c.end, start + length - 1)
        const off = s - c.start
        const len = e - s + 1
        out.set(c.data.subarray(off, off + len), written)
        written += len
        cursor += len
        if (written >= length) break
      }
      return out
    }

    const parseLocalHeader = (data: Uint8Array, offset: number) => {
      const dv = new DataView(data.buffer, data.byteOffset + offset)
      if (dv.getUint32(0, true) !== SIG.LOCAL_FILE_HEADER) return null
      const fn = dv.getUint16(26, true),
        ex = dv.getUint16(28, true)
      return { headerSize: 30 + fn + ex }
    }

    let downloaded = 0
    const complete: ZipEntryWithData[] = []
    const done = new Set<number>()

    while (downloaded < ov.contentLength) {
      if (signal?.aborted) {
        console.log('[ZipDownloader] 流式下载被中止')
        throw new Error('Aborted')
      }
      const start = downloaded
      const end = Math.min(start + chunkSize - 1, ov.contentLength - 1)
      console.log(
        `[ZipDownloader] 下载块: ${start}-${end} (${end - start + 1} 字节)`
      )
      const buf = await this.rangeHelper.range(start, end, signal)
      chunks.push({ start, end, data: buf })
      downloaded = end + 1
      const progress = ((downloaded / ov.contentLength) * 100).toFixed(2)
      console.log(
        `[ZipDownloader] 下载进度: ${progress}% (${downloaded}/${ov.contentLength})`
      )
      onProgress?.(downloaded, ov.contentLength)

      for (const entry of sorted) {
        if (done.has(entry.index)) continue
        const localHeaderMin = entry.localHeaderOffset + 30
        if (downloaded < localHeaderMin) continue
        const headerData = extractRange(
          entry.localHeaderOffset,
          Math.min(30 + 1024, downloaded - entry.localHeaderOffset)
        )
        const header = parseLocalHeader(headerData, 0)
        if (!header) continue
        const dataStart = entry.localHeaderOffset + header.headerSize
        const dataEnd = dataStart + entry.compressedSize
        if (downloaded < dataEnd) continue

        const comp = extractRange(dataStart, entry.compressedSize)
        console.log(
          `[ZipDownloader] 提取文件数据: ${entry.fileName} (${comp.length} 字节)`
        )
        const { bytes, isDecompressed, method } = await maybeDecompress(
          entry.compressionMethod,
          comp,
          this.opts.tryDecompress
        )
        const mimeType = getMimeType(entry.fileName, bytes)
        const item: ZipEntryWithData = { ...entry, data: bytes }
        console.log(
          `[ZipDownloader] 文件处理完成: ${entry.fileName} (${bytes.length} 字节, MIME: ${mimeType}, 解压: ${isDecompressed})`
        )
        onFileComplete?.(item, {
          downloadTime: performance.now() - t0,
          method,
          isDecompressed,
          mimeType,
          physicalIndex: entry.index,
        })
        done.add(entry.index)
        complete.push(item)
      }
    }

    const totalTime = performance.now() - t0
    console.log(
      `[ZipDownloader] 流式下载完成: ${complete.length}/${sorted.length} 个文件，耗时: ${totalTime.toFixed(2)}ms`
    )

    return {
      totalFiles: sorted.length,
      completedFiles: complete.length,
      entries: complete,
    }
  }
}
