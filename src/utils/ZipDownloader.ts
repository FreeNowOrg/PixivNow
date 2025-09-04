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
 *   tryDecompress: true           // 尝试解压
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
 * // result.entries 包含所有完成下载的文件数据
 */

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export interface ZipDownloaderOptions {
  fetch?: FetchLike // 替换 fetch（Node 可注入 node-fetch/undici）
  timeoutMs?: number // 单请求超时
  retries?: number // 失败重试次数（指数退避）
  lruBytes?: number // Range 缓存的最大总字节数（近似）
  parallelProbe?: number // 批量探测本地头的并发度
  maxConcurrentRequests?: number // 最大并发请求数，默认 6
  tryDecompress?: boolean // 尝试解压（method 0/8）
  chunkSize?: number // 分片大小（字节），默认 128KB
  initialTailSize?: number // 初始尾部抓取大小（字节），默认 32KB
  maxTailSize?: number // 最大尾部抓取大小（字节），默认 70KB
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
  mimeType?: string // 通过扩展名推断的MIME类型
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
  dataStart: number // 压缩数据起点（不含本地头/文件名/extra）
  dataLength: number // 压缩数据长度
}

const SIG = {
  EOCD: 0x06054b50,
  ZIP64_EOCD_LOCATOR: 0x07064b50,
  ZIP64_EOCD: 0x06064b50,
  CD_FILE_HEADER: 0x02014b50,
  LOCAL_FILE_HEADER: 0x04034b50,
}

const TEXT_DECODER = new TextDecoder()

// MIME类型映射表
const MIME_TYPES: Record<string, string> = {
  // 图片格式
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

  // 视频格式
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mkv: 'video/x-matroska',

  // 音频格式
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',

  // 文档格式
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // 文本格式
  txt: 'text/plain',
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
  csv: 'text/csv',

  // 压缩格式
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',

  // 其他
  exe: 'application/x-msdownload',
  dmg: 'application/x-apple-diskimage',
  iso: 'application/x-iso9660-image',
}

/**
 * 通过文件扩展名获取MIME类型
 */
function getMimeTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (!extension) return 'application/octet-stream'
  return MIME_TYPES[extension] || 'application/octet-stream'
}

/**
 * 通过文件头（Magic Number）检测MIME类型
 */
function getMimeTypeFromMagicNumber(data: Uint8Array): string {
  if (data.length < 4) return 'application/octet-stream'

  // 检查文件头签名
  const header = Array.from(data.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (header.startsWith('89504e470d0a1a0a')) return 'image/png'

  // JPEG: FF D8 FF
  if (header.startsWith('ffd8ff')) return 'image/jpeg'

  // GIF: 47 49 46 38 (GIF8)
  if (header.startsWith('47494638')) return 'image/gif'

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (header.startsWith('52494646') && data.length >= 12) {
    const webpHeader = Array.from(data.slice(8, 12))
      .map((b) => String.fromCharCode(b))
      .join('')
    if (webpHeader === 'WEBP') return 'image/webp'
  }

  // BMP: 42 4D
  if (header.startsWith('424d')) return 'image/bmp'

  // SVG: 检查是否以 <svg 开头（文本格式）
  if (data.length >= 4) {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(
      data.slice(0, Math.min(100, data.length))
    )
    if (text.trim().toLowerCase().startsWith('<svg')) return 'image/svg+xml'
  }

  // PDF: 25 50 44 46 (%PDF)
  if (header.startsWith('25504446')) return 'application/pdf'

  // ZIP: 50 4B 03 04 或 50 4B 05 06 或 50 4B 07 08
  if (
    header.startsWith('504b0304') ||
    header.startsWith('504b0506') ||
    header.startsWith('504b0708')
  ) {
    return 'application/zip'
  }

  // MP4: 检查 ftyp box
  if (data.length >= 8) {
    const boxSize = new DataView(data.buffer, data.byteOffset, 4).getUint32(
      0,
      false
    )
    if (boxSize >= 8 && data.length >= boxSize) {
      const boxType = new TextDecoder().decode(data.slice(4, 8))
      if (boxType === 'ftyp') return 'video/mp4'
    }
  }

  // MP3: FF FB 或 FF F3 或 FF F2
  if (
    header.startsWith('fffb') ||
    header.startsWith('fff3') ||
    header.startsWith('fff2')
  ) {
    return 'audio/mpeg'
  }

  // WAV: 52 49 46 46 ... 57 41 56 45
  if (header.startsWith('52494646') && data.length >= 12) {
    const wavHeader = Array.from(data.slice(8, 12))
      .map((b) => String.fromCharCode(b))
      .join('')
    if (wavHeader === 'WAVE') return 'audio/wav'
  }

  return 'application/octet-stream'
}

/**
 * 综合获取MIME类型（优先使用文件头检测，回退到扩展名）
 */
function getMimeType(fileName: string, data?: Uint8Array): string {
  // 如果有文件数据，优先使用文件头检测
  if (data && data.length > 0) {
    const magicMimeType = getMimeTypeFromMagicNumber(data)
    // 如果文件头检测成功且不是默认值，使用文件头结果
    if (magicMimeType !== 'application/octet-stream') {
      return magicMimeType
    }
  }

  // 回退到扩展名检测
  return getMimeTypeFromExtension(fileName)
}

// 并发限制器
class ConcurrencyLimiter {
  private running = 0
  private queue: Array<() => void> = []

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++
      return
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    this.running--
    if (this.queue.length > 0) {
      const next = this.queue.shift()!
      this.running++
      next()
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

// 简易 LRU 缓存（按插入近似控制体积）
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
    if (v.byteLength > this.maxBytes) return // 太大就不缓存
    if (this.map.has(k)) {
      const old = this.map.get(k)!
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

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  baseDelay = 200
): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (e) {
      if (attempt >= retries) throw e
      const delay = baseDelay * Math.pow(2, attempt) * (1 + Math.random() * 0.2)
      await sleep(delay)
      attempt++
    }
  }
}

function findSignatureFromEnd(buf: Uint8Array, signature: number): number {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  for (let i = buf.byteLength - 4; i >= 0; i--) {
    if (dv.getUint32(i, true) === signature) return i
  }
  return -1
}

function readAscii(dv: DataView, offset: number, length: number): string {
  const u8 = new Uint8Array(dv.buffer, dv.byteOffset + offset, length)
  return TEXT_DECODER.decode(u8)
}

async function streamDecompressIfPossible(
  method: number,
  data: Uint8Array,
  tryDecompress: boolean
): Promise<{ bytes: Uint8Array; isDecompressed: boolean; method: number }> {
  if (!tryDecompress) return { bytes: data, isDecompressed: false, method }
  if (method === 0) return { bytes: data, isDecompressed: true, method }
  if (
    method === 8 &&
    typeof (globalThis as any).DecompressionStream === 'function'
  ) {
    // ZIP 的 deflate 是 raw（不带 zlib 头）
    const ds = new (globalThis as any).DecompressionStream('deflate-raw')
    const r = new Response(
      new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(ds)
    )
    const ab = await r.arrayBuffer()
    return { bytes: new Uint8Array(ab), isDecompressed: true, method }
  }
  // 其他情况（Node/无 DS/其他压缩法）降级为返回压缩数据
  return { bytes: data, isDecompressed: false, method }
}

export class ZipDownloader {
  private options: Required<ZipDownloaderOptions>
  private inflight = new Map<string, Promise<any>>() // 统一去重：range/元数据/条目
  private rangeCache: ByteLRU
  private overview?: ZipOverview
  private dataRanges?: DataRange[] // 解析过的数据段定位缓存
  private pathToIndex = new Map<string, number>() // fileName -> index
  private concurrencyLimiter: ConcurrencyLimiter

  constructor(
    private url: string,
    options: ZipDownloaderOptions = {}
  ) {
    this.options = {
      fetch: options.fetch ?? fetch.bind(globalThis),
      timeoutMs: options.timeoutMs ?? 15000,
      retries: options.retries ?? 2,
      lruBytes: options.lruBytes ?? 16 * 1024 * 1024, // 16MB
      parallelProbe: options.parallelProbe ?? 4, // 降低默认并发数
      maxConcurrentRequests: options.maxConcurrentRequests ?? 6, // 新增：最大并发请求数
      tryDecompress: options.tryDecompress ?? true,
      chunkSize: options.chunkSize ?? 128 * 1024, // 128KB
      initialTailSize: options.initialTailSize ?? 16 * 1024, // 16KB
      maxTailSize: options.maxTailSize ?? 128 * 1024, // 128KB
    }
    this.rangeCache = new ByteLRU(this.options.lruBytes)
    this.concurrencyLimiter = new ConcurrencyLimiter(
      this.options.maxConcurrentRequests
    )
  }

  /**
   * 动态更新配置并按需重建内部状态（不清理已下载的 range 缓存，除非相关设置变化）
   * 可用于在同一实例上调整并发、重试、分片大小等参数。
   */
  setOptions(partial: ZipDownloaderOptions): this {
    const old = this.options
    // 合并新配置（保持现有 fetch 绑定）
    this.options = {
      ...old,
      ...partial,
      fetch: partial.fetch ?? old.fetch,
      timeoutMs: partial.timeoutMs ?? old.timeoutMs,
      retries: partial.retries ?? old.retries,
      lruBytes: partial.lruBytes ?? old.lruBytes,
      parallelProbe: partial.parallelProbe ?? old.parallelProbe,
      maxConcurrentRequests:
        partial.maxConcurrentRequests ?? old.maxConcurrentRequests,
      tryDecompress: partial.tryDecompress ?? old.tryDecompress,
      chunkSize: partial.chunkSize ?? old.chunkSize,
      initialTailSize: partial.initialTailSize ?? old.initialTailSize,
      maxTailSize: partial.maxTailSize ?? old.maxTailSize,
    }

    // 如果缓存大小发生变化重建 LRU
    if (old.lruBytes !== this.options.lruBytes) {
      this.rangeCache = new ByteLRU(this.options.lruBytes)
    }
    // 并发相关变动则重建 limiter
    if (old.maxConcurrentRequests !== this.options.maxConcurrentRequests) {
      this.concurrencyLimiter = new ConcurrencyLimiter(
        this.options.maxConcurrentRequests
      )
    }
    return this
  }

  /** 获取文件总长度（Content-Length） */
  async getSize(signal?: AbortSignal): Promise<number> {
    const key = `size`
    if (!this.inflight.has(key)) {
      this.inflight.set(
        key,
        this._getContentLength(signal).catch((error) => {
          this.inflight.delete(key)
          throw error
        })
      )
    }
    const size = await this.inflight.get(key)!
    return size
  }

  /** 获取 ZIP 中央目录信息（含缓存/去重） */
  async getCentralDirectory(signal?: AbortSignal): Promise<ZipOverview> {
    if (this.overview) return this.overview
    const key = `overview`
    if (!this.inflight.has(key)) {
      this.inflight.set(
        key,
        this._buildOverview(signal)
          .then((ov) => {
            this.overview = ov
            // 快速路径映射
            ov.entries.forEach((e) => this.pathToIndex.set(e.fileName, e.index))
            return ov
          })
          .catch((error) => {
            this.inflight.delete(key)
            throw error
          })
      )
    }
    return this.inflight.get(key)!
  }

  /** 通过条目索引下载单个文件（默认尽力解压，若无法解压则返回压缩数据） */
  async downloadByIndex(
    index: number,
    signal?: AbortSignal
  ): Promise<{
    fileName: string
    index: number
    bytes: Uint8Array
    isDecompressed: boolean
    method: number
    compressedSize: number
    uncompressedSize: number
    mimeType: string // 通过文件头检测的准确MIME类型
    mimeTypeFromExtension: string // 通过扩展名推断的MIME类型
  }> {
    const ov = await this.getCentralDirectory(signal)
    if (index < 0 || index >= ov.entryCount)
      throw new Error(`index out of range: ${index}`)
    const e = ov.entries[index]

    // 解析数据段范围（带缓存/去重）
    const ranges = await this._ensureDataRanges(signal)
    const r = ranges[index]

    const key = `entry:${index}:${r.dataStart}-${r.dataLength}`
    if (!this.inflight.has(key)) {
      this.inflight.set(
        key,
        (async () => {
          const body = await this._fetchRange(
            r.dataStart,
            r.dataStart + r.dataLength - 1,
            signal
          )
          const { bytes, isDecompressed, method } =
            await streamDecompressIfPossible(
              e.compressionMethod,
              body,
              this.options.tryDecompress
            )

          // 获取MIME类型
          const mimeTypeFromExtension = getMimeTypeFromExtension(e.fileName)
          const mimeType = getMimeType(e.fileName, bytes)

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
        })().catch((error) => {
          this.inflight.delete(key)
          throw error
        })
      )
    }
    return this.inflight.get(key)!
  }

  /** 通过路径下载单个文件（大小写敏感，完全匹配） */
  async downloadByPath(path: string, signal?: AbortSignal) {
    const ov = await this.getCentralDirectory(signal)
    const idx = this.pathToIndex.get(path)
    if (idx == null) {
      // 退而求其次：做一次 O(n) 查找
      const found = ov.entries.find((e) => e.fileName === path)
      if (!found) throw new Error(`file not found in zip: ${path}`)
      return this.downloadByIndex(found.index, signal)
    }
    return this.downloadByIndex(idx, signal)
  }

  // ------------------- 内部实现 -------------------

  private async _getContentLength(signal?: AbortSignal): Promise<number> {
    const doHead = async () => {
      console.log('[ZipDownloader] Trying HEAD request for content-length')
      const res = await withTimeout(
        this.options.fetch(this.url, { method: 'HEAD', signal }),
        this.options.timeoutMs
      )
      console.log('[ZipDownloader] HEAD response:', {
        status: res.status,
        ok: res.ok,
        contentLength: res.headers.get('content-length'),
      })

      if (!res.ok) {
        throw new Error(`HEAD request failed with status ${res.status}`)
      }

      const len = res.headers.get('content-length')
      if (!len) {
        throw new Error(
          'HEAD request succeeded but missing content-length header'
        )
      }

      const length = Number(len)
      if (isNaN(length) || length < 0) {
        throw new Error(`Invalid content-length value: ${len}`)
      }

      console.log(
        '[ZipDownloader] HEAD request successful, content-length:',
        length
      )
      return length
    }

    const doProbe = async () => {
      console.log(
        '[ZipDownloader] Trying Range: bytes=0-0 request for content-length'
      )
      const res = await withTimeout(
        this.options.fetch(this.url, {
          headers: { Range: 'bytes=0-0' },
          signal,
        }),
        this.options.timeoutMs
      )
      console.log('[ZipDownloader] Range response:', {
        status: res.status,
        ok: res.ok,
        contentRange: res.headers.get('content-range'),
      })

      const cr = res.headers.get('content-range') // e.g. "bytes 0-0/12345"
      if (!cr) {
        throw new Error(
          'Server does not support range requests or missing content-range header'
        )
      }

      const m = cr.match(/\/(\d+)$/)
      if (!m) {
        throw new Error(`Cannot parse content-range: ${cr}`)
      }

      const length = Number(m[1])
      if (isNaN(length) || length < 0) {
        throw new Error(`Invalid content-length from range: ${m[1]}`)
      }

      console.log(
        '[ZipDownloader] Range request successful, content-length:',
        length
      )
      return length
    }

    return retry(async () => {
      try {
        return await doHead()
      } catch (headError) {
        console.log(
          '[ZipDownloader] HEAD request failed, falling back to range request:',
          (headError as Error).message
        )
        return await doProbe()
      }
    }, this.options.retries)
  }

  private async _buildOverview(signal?: AbortSignal): Promise<ZipOverview> {
    const contentLength = await this._getContentLength(signal)

    // 渐进式抓取尾部数据：先尝试初始大小，不够再扩展
    let tailSize = Math.min(this.options.initialTailSize, contentLength)
    let tailStart = contentLength - tailSize
    let tail = await this._fetchRange(tailStart, contentLength - 1, signal)
    let tailDV = new DataView(tail.buffer, tail.byteOffset, tail.byteLength)

    let eocdPos = findSignatureFromEnd(tail, SIG.EOCD)

    if (eocdPos > -1) {
      console.log('[ZipDownloader] EOCD found in initial tail:', {
        eocdPos,
        tailSize,
        contentLength,
      })
    }

    // 如果初始大小不够找到 EOCD，逐步扩展
    while (eocdPos === -1 && tailSize < contentLength) {
      // 扩展抓取范围，每次增加初始大小，最大不超过 maxTailSize
      const newTailSize = Math.min(
        tailSize + this.options.initialTailSize,
        this.options.maxTailSize,
        contentLength
      )
      if (newTailSize === tailSize) break // 无法再扩展

      console.log('[ZipDownloader] Fetching tail:', {
        tailSize,
        newTailSize,
        contentLength,
      })

      tailSize = newTailSize
      tailStart = contentLength - tailSize
      tail = await this._fetchRange(tailStart, contentLength - 1, signal)
      tailDV = new DataView(tail.buffer, tail.byteOffset, tail.byteLength)
      eocdPos = findSignatureFromEnd(tail, SIG.EOCD)
    }

    if (eocdPos === -1)
      throw new Error('EOCD not found; invalid ZIP or clipped tail')

    let cdCount = 0
    let cdSize = 0
    let cdOffset = 0
    let zip64 = false

    // EOCD
    {
      const base = eocdPos
      cdCount = tailDV.getUint16(base + 10, true)
      cdSize = tailDV.getUint32(base + 12, true)
      cdOffset = tailDV.getUint32(base + 16, true)
      if (
        cdCount === 0xffff ||
        cdSize === 0xffffffff ||
        cdOffset === 0xffffffff
      )
        zip64 = true
    }

    if (zip64) {
      const locPos = findSignatureFromEnd(tail, SIG.ZIP64_EOCD_LOCATOR)
      if (locPos === -1)
        throw new Error('ZIP64 locator not found, but EOCD indicates ZIP64')
      const z64Off = Number(tailDV.getBigUint64(locPos + 8, true))
      const z64Hdr = await this._fetchRange(z64Off, z64Off + 160 - 1, signal)
      const dv = new DataView(
        z64Hdr.buffer,
        z64Hdr.byteOffset,
        z64Hdr.byteLength
      )
      if (dv.getUint32(0, true) !== SIG.ZIP64_EOCD)
        throw new Error('ZIP64 EOCD signature mismatch')
      cdCount = Number(dv.getBigUint64(32, true))
      cdSize = Number(dv.getBigUint64(40, true))
      cdOffset = Number(dv.getBigUint64(48, true))
    }

    const cdBuf = await this._fetchRange(
      cdOffset,
      cdOffset + cdSize - 1,
      signal
    )
    const cdDV = new DataView(cdBuf.buffer, cdBuf.byteOffset, cdBuf.byteLength)

    const entries: ZipEntry[] = []
    let p = 0
    for (let i = 0; p < cdBuf.byteLength && i < cdCount; i++) {
      const sig = cdDV.getUint32(p, true)
      if (sig !== SIG.CD_FILE_HEADER) break

      const generalPurposeBitFlag = cdDV.getUint16(p + 8, true)
      const compressionMethod = cdDV.getUint16(p + 10, true)
      const crc32 = cdDV.getUint32(p + 16, true)
      const compSize32 = cdDV.getUint32(p + 20, true)
      const uncompSize32 = cdDV.getUint32(p + 24, true)
      const fnLen = cdDV.getUint16(p + 28, true)
      const extraLen = cdDV.getUint16(p + 30, true)
      const commentLen = cdDV.getUint16(p + 32, true)
      const localHeaderOffset32 = cdDV.getUint32(p + 42, true)
      const name = readAscii(cdDV, p + 46, fnLen)

      let compressedSize = compSize32
      let uncompressedSize = uncompSize32
      let localHeaderOffset = localHeaderOffset32
      let requiresZip64 = false

      // 解析 extra
      const extraStart = p + 46 + fnLen
      const extra = new DataView(
        cdBuf.buffer,
        cdBuf.byteOffset + extraStart,
        extraLen
      )
      let ep = 0
      while (ep + 4 <= extraLen) {
        const headerId = extra.getUint16(ep, true)
        const dataSize = extra.getUint16(ep + 2, true)
        const dataStart = ep + 4
        if (headerId === 0x0001) {
          requiresZip64 = true
          let z = dataStart
          if (
            uncompressedSize === 0xffffffff &&
            z + 8 <= dataStart + dataSize
          ) {
            uncompressedSize = Number(extra.getBigUint64(z, true))
            z += 8
          }
          if (compressedSize === 0xffffffff && z + 8 <= dataStart + dataSize) {
            compressedSize = Number(extra.getBigUint64(z, true))
            z += 8
          }
          if (
            localHeaderOffset === 0xffffffff &&
            z + 8 <= dataStart + dataSize
          ) {
            localHeaderOffset = Number(extra.getBigUint64(z, true))
            z += 8
          }
        }
        ep += 4 + dataSize
      }

      entries.push({
        index: i,
        fileName: name,
        compressedSize,
        uncompressedSize,
        crc32,
        compressionMethod,
        generalPurposeBitFlag,
        localHeaderOffset,
        centralHeaderOffset: cdOffset + p,
        requiresZip64,
        mimeType: getMimeTypeFromExtension(name), // 添加MIME类型
      })

      p = extraStart + extraLen + commentLen
    }

    return {
      url: this.url,
      contentLength,
      centralDirectoryOffset: cdOffset,
      centralDirectorySize: cdSize,
      entryCount: entries.length,
      entries,
    }
  }

  private async _ensureDataRanges(signal?: AbortSignal): Promise<DataRange[]> {
    if (this.dataRanges) return this.dataRanges

    const key = `ranges`
    if (!this.inflight.has(key)) {
      this.inflight.set(
        key,
        (async () => {
          const ov = await this.getCentralDirectory(signal)
          const results: DataRange[] = new Array(ov.entryCount)
          const q: number[] = ov.entries.map((e) => e.index)

          // 使用更保守的并发控制策略
          const limit = Math.min(
            this.options.parallelProbe,
            this.options.maxConcurrentRequests
          )
          const semaphore = new ConcurrencyLimiter(limit)

          // 批量处理，避免同时启动过多请求
          const batchSize = Math.min(limit, 8) // 每批最多8个
          const batches: number[][] = []
          for (let i = 0; i < q.length; i += batchSize) {
            batches.push(q.slice(i, i + batchSize))
          }

          // 逐批处理，每批内部并发
          for (const batch of batches) {
            const batchPromises = batch.map(async (idx) => {
              const e = ov.entries[idx]
              return semaphore.execute(async () => {
                const dr = await this._probeLocalHeader(e, signal)
                results[idx] = dr
              })
            })
            await Promise.all(batchPromises)
          }

          // 填补目录项（文件夹）可能没有数据段：compressedSize=0
          for (let j = 0; j < results.length; j++) {
            if (!results[j]) {
              const e = ov.entries[j]
              results[j] = {
                index: e.index,
                fileName: e.fileName,
                dataStart: e.localHeaderOffset + 30,
                dataLength: e.compressedSize,
              }
            }
          }
          this.dataRanges = results
          return results
        })().catch((error) => {
          this.inflight.delete(key)
          throw error
        })
      )
    }
    return this.inflight.get(key)!
  }

  private async _probeLocalHeader(
    e: ZipEntry,
    signal?: AbortSignal
  ): Promise<DataRange> {
    // 读取本地头（固定30字节）+ 可变 fileName/extra 上限（抓 30+512 足够绝大多数）
    const key = `probe:${e.localHeaderOffset}`
    if (!this.inflight.has(key)) {
      this.inflight.set(
        key,
        (async () => {
          const probe = await this._fetchRange(
            e.localHeaderOffset,
            e.localHeaderOffset + 30 + this.options.chunkSize - 1,
            signal
          )
          const dv = new DataView(
            probe.buffer,
            probe.byteOffset,
            probe.byteLength
          )
          if (dv.getUint32(0, true) !== SIG.LOCAL_FILE_HEADER) {
            throw new Error(
              `Local header signature mismatch at offset ${e.localHeaderOffset}`
            )
          }
          const fnLen = dv.getUint16(26, true)
          const extraLen = dv.getUint16(28, true)
          const dataStart = e.localHeaderOffset + 30 + fnLen + extraLen
          return {
            index: e.index,
            fileName: e.fileName,
            dataStart,
            dataLength: e.compressedSize,
          }
        })().catch((error) => {
          this.inflight.delete(key)
          throw error
        })
      )
    }
    return this.inflight.get(key)!
  }

  private async _fetchRange(
    start: number,
    end: number,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const cacheKey = `r:${start}-${end}`
    const cached = this.rangeCache.get(cacheKey)
    if (cached) return cached

    const inflightKey = `fetch:${start}-${end}`
    if (!this.inflight.has(inflightKey)) {
      const runner = async () => {
        return this.concurrencyLimiter.execute(async () => {
          const res = await retry(async () => {
            const r = await withTimeout(
              this.options.fetch(this.url, {
                headers: { Range: `bytes=${start}-${end}` },
                signal,
              }),
              this.options.timeoutMs
            )
            if (!(r.status === 206 || r.status === 200))
              throw new Error(`HTTP ${r.status} fetching range ${start}-${end}`)
            return r
          }, this.options.retries)
          const u8 = new Uint8Array(await res.arrayBuffer())
          // 写缓存
          this.rangeCache.set(cacheKey, u8)
          return u8
        })
      }
      this.inflight.set(
        inflightKey,
        runner().catch((error) => {
          this.inflight.delete(inflightKey)
          throw error
        })
      )
    }
    const buf: Uint8Array = await this.inflight.get(inflightKey)!
    return buf
  }

  cleanup() {
    this.inflight.clear()
    this.rangeCache = new ByteLRU(this.options.lruBytes)
    this.overview = undefined
    this.dataRanges = undefined
    this.pathToIndex.clear()
    // 重新创建并发限制器，确保状态重置
    this.concurrencyLimiter = new ConcurrencyLimiter(
      this.options.maxConcurrentRequests
    )
    return this
  }

  setUrl(url: string) {
    if (this.url === url) return this
    this.url = url
    this.cleanup()
    return this
  }

  /**
   * 暴露内部解析好的数据范围（每个 entry 的压缩数据段起止与长度）。
   * 仅做读取，不会触发额外网络请求（除非首次解析）。
   * 用于顺序整包下载逻辑，根据 dataStart + dataLength 判断某个文件数据是否已经完整到达。
   */
  async getDataRanges(signal?: AbortSignal) {
    // 复用内部缓存逻辑
    // @ts-ignore 私有方法受控调用（保持最小侵入，不改变原有可见性）
    return this._ensureDataRanges(signal)
  }

  /**
   * 真正的流式下载方法（完全避免预探测，适合大型ZIP文件）
   * 从头开始顺序下载，动态解析本地头，边下载边提取完整文件
   */
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
    onProgress?: (downloadedBytes: number, contentLength: number) => void
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
      chunkSize = this.options.chunkSize,
      signal,
    } = params

    const startTime = performance.now()
    const ov = await this.getCentralDirectory(signal)
    const completedEntries: ZipEntryWithData[] = []
    let completedFiles = 0

    // 按物理位置排序中央目录条目
    const sortedEntries = ov.entries
      .filter((entry) => entry.compressedSize > 0) // 只处理有数据的文件
      .sort((a, b) => a.localHeaderOffset - b.localHeaderOffset)

    if (sortedEntries.length === 0) {
      return { totalFiles: 0, completedFiles: 0, entries: [] }
    }

    let downloadedBytes = 0
    const chunks: { start: number; end: number; data: Uint8Array }[] = []
    const processedEntries = new Set<number>()

    // 连续的已下载数据缓冲区
    const extractRange = (start: number, length: number): Uint8Array => {
      const out = new Uint8Array(length)
      let written = 0
      let cursor = start

      for (const chunk of chunks) {
        if (chunk.end < cursor) continue
        if (chunk.start > cursor + (length - written - 1)) break

        const segStart = Math.max(chunk.start, cursor)
        const segEnd = Math.min(chunk.end, start + length - 1)
        const offsetInChunk = segStart - chunk.start
        const sliceLen = segEnd - segStart + 1

        out.set(
          chunk.data.subarray(offsetInChunk, offsetInChunk + sliceLen),
          written
        )
        written += sliceLen
        cursor += sliceLen

        if (written >= length) break
      }

      return out
    }

    // 解析本地头信息
    const parseLocalHeader = (data: Uint8Array, offset: number) => {
      const dv = new DataView(data.buffer, data.byteOffset + offset)
      if (dv.getUint32(0, true) !== SIG.LOCAL_FILE_HEADER) {
        return null
      }
      const fnLen = dv.getUint16(26, true)
      const extraLen = dv.getUint16(28, true)
      return {
        headerSize: 30 + fnLen + extraLen,
        fileNameLength: fnLen,
        extraFieldLength: extraLen,
      }
    }

    // 按块下载并动态处理文件
    while (downloadedBytes < ov.contentLength) {
      if (signal?.aborted) throw new Error('Aborted')

      const rangeStart = downloadedBytes
      const rangeEnd = Math.min(
        rangeStart + chunkSize - 1,
        ov.contentLength - 1
      )

      const buf = await this._fetchRange(rangeStart, rangeEnd, signal)
      chunks.push({ start: rangeStart, end: rangeEnd, data: buf })
      downloadedBytes = rangeEnd + 1

      onProgress?.(downloadedBytes, ov.contentLength)

      // 检查是否有新的完整文件可以提取
      for (const entry of sortedEntries) {
        if (processedEntries.has(entry.index)) continue

        // 检查是否已下载到本地头位置
        const localHeaderEnd = entry.localHeaderOffset + 30
        if (downloadedBytes < localHeaderEnd) continue

        // 尝试解析本地头
        const headerData = extractRange(
          entry.localHeaderOffset,
          Math.min(30 + 1024, downloadedBytes - entry.localHeaderOffset)
        )
        const headerInfo = parseLocalHeader(headerData, 0)
        if (!headerInfo) continue

        const dataStart = entry.localHeaderOffset + headerInfo.headerSize
        const dataEnd = dataStart + entry.compressedSize

        // 检查文件数据是否完整下载
        if (downloadedBytes < dataEnd) continue

        // 提取文件数据
        const compressedData = extractRange(dataStart, entry.compressedSize)

        // 尝试解压
        const {
          bytes: decompressed,
          isDecompressed,
          method,
        } = await streamDecompressIfPossible(
          entry.compressionMethod,
          compressedData,
          this.options.tryDecompress
        )

        const mimeType = getMimeType(entry.fileName, decompressed)
        const now = performance.now()

        const entryWithData: ZipEntryWithData = {
          ...entry,
          data: decompressed,
        }

        onFileComplete?.(entryWithData, {
          downloadTime: now - startTime,
          method,
          isDecompressed,
          mimeType,
          physicalIndex: entry.index,
        })

        processedEntries.add(entry.index)
        completedFiles++
        completedEntries.push(entryWithData)
      }
    }

    return {
      totalFiles: sortedEntries.length,
      completedFiles,
      entries: completedEntries,
    }
  }
}
