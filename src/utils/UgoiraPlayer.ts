import { Artwork } from '@/types'
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url'
import { ZipDownloader, ZipDownloaderOptions } from './ZipDownloader'

/**
 * Public options
 */
export interface UgoiraPlayerOptions {
  onDownloadProgress?: (
    progress: number,
    frameIndex: number,
    totalFrames: number
  ) => void
  onDownloadComplete?: () => void
  onDownloadError?: (error: Error) => void
  zipDownloaderOptions?: ZipDownloaderOptions
  requestTimeoutMs?: number
  preferImageBitmap?: boolean
  playbackRate?: number
  progressiveRender?: boolean
}

export interface UgoiraFrame {
  file: string
  delay: number
}
export interface UgoiraMeta {
  frames: UgoiraFrame[]
  mime_type: string
  originalSrc: string
  src: string
}

/** Internal structures */
interface CachedVisual {
  /** kept for backward-compat paths (gif/mp4) */
  img?: HTMLImageElement
  /** preferred for runtime drawing */
  bitmap?: ImageBitmap
  /** object URL for cleanup */
  url: string
  /** raw bytes for re-encode */
  buf: Uint8Array
}

/** Player state */
const enum PlayerState {
  Idle,
  Downloading,
  Ready,
  Playing,
  Paused,
  Destroyed,
}

/**
 * UgoiraPlayer
 * @author dragon-fish
 * @license MIT
 */
export class UgoiraPlayer {
  // ====== private fields ======
  private _canvas?: HTMLCanvasElement
  private _illust!: Artwork
  private _meta?: UgoiraMeta

  private state: PlayerState = PlayerState.Idle
  private isPlaying = false

  private curFrame = 0
  private lastFrameTime = 0
  private nextFrameDue = 0

  private cached: Map<string, CachedVisual> = new Map()
  private objectURLs: Set<string> = new Set()
  private files: Record<string, Uint8Array> = {}

  private zipDownloader?: ZipDownloader
  private aborter?: AbortController

  private downloadProgress = 0
  private isDownloading = false
  private isDownloadComplete = false
  private downloadStartTime = 0
  private frameDownloadTimes: number[] = []
  private frameReady: boolean[] = []

  private lastRenderedFrameIndex = -1
  private renderTimer: number | undefined

  // New: runtime settings
  private _playbackRate = 1
  private _preferImageBitmap = true
  private _progressiveRender = true

  constructor(
    illust: Artwork,
    public options: UgoiraPlayerOptions = {}
  ) {
    this._preferImageBitmap = options.preferImageBitmap ?? true
    this._playbackRate = options.playbackRate ?? 1
    this._progressiveRender = options.progressiveRender ?? true
    this.reset(illust)
  }

  // ====== lifecycle ======
  reset(illust: Artwork) {
    this.destroy()
    this._canvas = undefined
    this._illust = illust

    this.downloadProgress = 0
    this.isDownloading = false
    this.isDownloadComplete = false
    this.downloadStartTime = 0
    this.frameDownloadTimes = []
    this.frameReady = []
    this.lastRenderedFrameIndex = -1
    this.curFrame = 0
    this.lastFrameTime = 0
    this.nextFrameDue = 0

    if (this.renderTimer) {
      clearTimeout(this.renderTimer)
      this.renderTimer = undefined
    }

    this.state = PlayerState.Idle
  }

  setupCanvas(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._canvas.width = this.initWidth
    this._canvas.height = this.initHeight
  }

  // ====== getters (public API preserved) ======
  get isReady() {
    return !!this._meta && Object.keys(this.files).length > 0
  }
  get canExport() {
    return this.isDownloadComplete && this.isReady
  }
  get downloadProgressPercent() {
    return this.downloadProgress
  }
  get downloadStats() {
    if (!this.isDownloadComplete && this.frameDownloadTimes.length === 0) {
      return null
    }
    const totalTime = performance.now() - this.downloadStartTime
    const avgFrameTime =
      this.frameDownloadTimes.length > 0
        ? this.frameDownloadTimes.reduce((a, b) => a + b, 0) /
          this.frameDownloadTimes.length
        : 0

    return {
      totalDownloadTime: totalTime,
      averageFrameTime: avgFrameTime,
      totalFrames: this.frameDownloadTimes.length,
      isComplete: this.isDownloadComplete,
      progress: this.downloadProgress,
    }
  }
  get isUgoira() {
    return this._illust.illustType === 2
  }
  get canvas() {
    return this._canvas
  }
  get illust() {
    return this._illust
  }
  get meta() {
    return this._meta
  }
  get totalFrames() {
    return this._meta?.frames.length ?? 0
  }
  get now() {
    return performance.now()
  }
  get initWidth() {
    return this._illust.width
  }
  get initHeight() {
    return this._illust.height
  }
  get mimeType() {
    return this._meta?.mime_type ?? ''
  }
  /** New: playbackRate getter/setter */
  get playbackRate() {
    return this._playbackRate
  }
  set playbackRate(v: number) {
    this._playbackRate = Math.max(0.1, v || 1)
  }

  // ====== network / assets ======
  async fetchMeta() {
    this._meta = await fetch(
      new URL(`/ajax/illust/${this._illust.id}/ugoira_meta`, location.href)
        .href,
      {
        cache: 'default',
      }
    ).then((res) => res.json())
    return this
  }

  async fetchFrames(originalQuality = false) {
    if (!this._meta) {
      await this.fetchMeta()
    }
    if (!this._meta) {
      throw new Error('Failed to fetch meta')
    }
    return this.streamingFetchAndDrawFrames(originalQuality)
  }

  /**
   * Optimized streaming download
   */
  private async streamingFetchAndDrawFrames(originalQuality = false) {
    if (this.isDownloading) {
      throw new Error('Download already in progress')
    }

    this.isDownloading = true
    this.state = PlayerState.Downloading
    this.downloadStartTime = performance.now()
    this.downloadProgress = 0
    this.frameDownloadTimes = []

    // Abort any previous network work
    this.aborter?.abort()
    this.aborter = new AbortController()

    try {
      const zipUrl = new URL(
        this._meta![originalQuality ? 'originalSrc' : 'src'],
        location.href
      ).href

      if (!this.zipDownloader) {
        this.zipDownloader = new ZipDownloader('')
      }
      this.zipDownloader.setUrl(zipUrl).setOptions({
        chunkSize: 256 * 1024,
        maxConcurrentRequests: 3,
        tryDecompress: true,
        timeoutMs: this.options.requestTimeoutMs ?? 10000,
        retries: 2,
        ...this.options.zipDownloaderOptions,
      })

      const { frames } = this._meta!
      const totalFrames = frames.length
      let processedFrames = 0

      this.frameReady = new Array(totalFrames).fill(false)
      this.lastRenderedFrameIndex = -1

      const result = await this.zipDownloader.streamingDownload({
        signal: this.aborter.signal,
        onFileComplete: (entryWithData, info) => {
          if (this.state === PlayerState.Destroyed) return

          const frameIndex = frames.findIndex(
            (f) => f.file === entryWithData.fileName
          )
          if (frameIndex === -1) {
            console.warn(
              `[UgoiraPlayer] Unknown frame: ${entryWithData.fileName}`
            )
            return
          }

          const frame = frames[frameIndex]

          // Store bytes & prepare visual cache lazily
          this.files[frame.file] = entryWithData.data
          this.frameDownloadTimes[frameIndex] = info.downloadTime
          processedFrames++

          // update progress
          this.downloadProgress = (processedFrames / totalFrames) * 100
          this.options.onDownloadProgress?.(
            this.downloadProgress,
            frameIndex,
            totalFrames
          )

          // flag ready and optionally schedule render
          this.frameReady[frameIndex] = true
          if (this._progressiveRender) this.scheduleNextFrame()
        },
      })

      console.info('[UgoiraPlayer] download complete', result)

      // completed
      this.isDownloadComplete = true
      this.isDownloading = false
      this.state = PlayerState.Ready

      this.options.onDownloadComplete?.()

      return this
    } catch (error) {
      this.isDownloading = false
      this.state = PlayerState.Idle
      this.options.onDownloadError?.(error as Error)
      throw error
    }
  }

  /**
   * Sequential scheduler: render frames 0..N in order as soon as each is ready.
   * If a gap is encountered, pause until the missing frame arrives.
   */
  private scheduleNextFrame() {
    if (!this._canvas || !this._meta) return
    if (this.renderTimer) return

    const { frames } = this._meta
    const nextIndex = this.lastRenderedFrameIndex + 1
    if (!this.frameReady[nextIndex]) return

    const renderSequential = async () => {
      while (true) {
        const idx = this.lastRenderedFrameIndex + 1
        if (idx >= frames.length) {
          this.renderTimer = undefined
          return
        }
        if (!this.frameReady[idx]) {
          this.renderTimer = undefined
          return
        }
        const frame = frames[idx]
        await this.renderFrameToCanvas(idx, frame)
        this.lastRenderedFrameIndex = idx

        await new Promise<void>((resolve) => {
          this.renderTimer = window.setTimeout(
            () => {
              this.renderTimer = undefined
              resolve()
            },
            Math.max(0, frame.delay / this._playbackRate)
          )
        })
      }
    }

    renderSequential().catch((e) => {
      console.error('[UgoiraPlayer] sequential render error:', e)
      this.renderTimer = undefined
    })
  }

  /** Render a single frame to the canvas */
  private async renderFrameToCanvas(frameIndex: number, frame: UgoiraFrame) {
    if (!this._canvas) return
    const ctx = this._canvas.getContext('2d')
    if (!ctx) return

    try {
      const visual = await this.getVisual(frame.file)
      const source = visual.bitmap ?? visual.img!
      // drawImage supports both HTMLImageElement and ImageBitmap
      ctx.drawImage(source as any, 0, 0, this.initWidth, this.initHeight)
      // console.debug(`[UgoiraPlayer] rendered frame ${frameIndex+1}`)
    } catch (error) {
      console.error(
        `[UgoiraPlayer] frame ${frameIndex + 1} render failed:`,
        error
      )
    }
  }

  // ====== caching primitives ======
  private async getVisual(fileName: string): Promise<CachedVisual> {
    const hit = this.cached.get(fileName)
    if (hit) {
      // Ensure image element fully loaded if present
      if (hit.img && !(hit.img.complete && hit.img.naturalWidth > 0)) {
        await new Promise<void>((resolve, reject) => {
          hit.img!.onload = () => resolve()
          hit.img!.onerror = () => reject(new Error('image load error'))
        })
      }
      return hit
    }

    const buf = this.files[fileName]
    if (!buf) throw new Error(`File ${fileName} not found`)

    const blob = new Blob([new Uint8Array(buf)], { type: this.mimeType })
    const url = URL.createObjectURL(blob)
    this.objectURLs.add(url)

    const visual: CachedVisual = { url, buf, img: undefined, bitmap: undefined }

    // Prefer ImageBitmap for runtime rendering; keep HTMLImageElement for encoders
    if (this._preferImageBitmap && 'createImageBitmap' in window) {
      try {
        visual.bitmap = await createImageBitmap(blob)
      } catch {
        // Fallback to HTMLImageElement
      }
    }

    if (!visual.bitmap) {
      const img = new Image()
      img.src = url
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('image load error'))
      })
      visual.img = img
    }

    this.cached.set(fileName, visual)
    return visual
  }

  /** Back-compat helper returning HTMLImageElement (may synthesize from cache) */
  private getImage(fileName: string): HTMLImageElement {
    const cached = this.cached.get(fileName)
    if (cached?.img) return cached.img

    const buf = this.files[fileName]
    if (!buf) throw new Error(`File ${fileName} not found`)

    const blob = new Blob([new Uint8Array(buf)], { type: this.mimeType })
    const url = URL.createObjectURL(blob)
    this.objectURLs.add(url)

    const img = new Image()
    img.src = url

    this.cached.set(fileName, { url, buf, img, bitmap: undefined })
    return img
  }

  /** Back-compat async image getter */
  private async getImageAsync(fileName: string): Promise<HTMLImageElement> {
    const v = await this.getVisual(fileName)
    if (v.img) return v.img
    // need to synthesize <img> from existing blob URL for encoders
    const img = new Image()
    img.src = v.url
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load error'))
    })
    v.img = img
    return img
  }

  getRealFrameSize() {
    if (!this.isReady) {
      throw new Error('Ugoira assets not ready, please fetch first')
    }
    const firstFrame = this.getImage(this.meta!.frames[0].file)
    return { width: firstFrame.width, height: firstFrame.height }
  }

  // ====== classic playback loop (preserved) ======
  private drawFrame() {
    if (!this.canvas || !this._meta || !this.isPlaying) return

    const ctx = this.canvas.getContext('2d')!
    const frame = this._meta.frames[this.curFrame]
    const delay = Math.max(0, frame.delay / this._playbackRate)

    const now = this.now
    if (this.nextFrameDue === 0) this.nextFrameDue = now + delay

    if (now >= this.nextFrameDue) {
      this.lastFrameTime = now
      this.curFrame = (this.curFrame + 1) % this.totalFrames
      this.nextFrameDue = now + delay
    }

    // Render current frame
    const img = this.getImage(frame.file)
    ctx.drawImage(img, 0, 0, this.initWidth, this.initHeight)

    requestAnimationFrame(() => this.drawFrame())
  }

  // ====== controls ======
  play() {
    this.isPlaying = true
    this.lastFrameTime = this.now
    this.nextFrameDue = 0
    this.state = PlayerState.Playing
    this.drawFrame()
  }

  pause() {
    this.isPlaying = false
    if (this.state !== PlayerState.Destroyed) this.state = PlayerState.Paused
  }

  /** Cancel any in-flight downloads */
  cancelDownload() {
    this.aborter?.abort()
  }

  destroy() {
    this.pause()

    if (this.renderTimer) {
      clearTimeout(this.renderTimer)
      this.renderTimer = undefined
    }

    this.cancelDownload()

    // Revoke URLs & clear caches
    this.objectURLs.forEach((url) => URL.revokeObjectURL(url))
    this.objectURLs.clear()

    this.cached.clear()
    this.files = {}

    this._meta = undefined
    this.zipDownloader = undefined
    this.isDownloading = false
    this.isDownloadComplete = false
    this.downloadProgress = 0
    this.downloadStartTime = 0
    this.frameDownloadTimes = []
    this.frameReady = []
    this.lastRenderedFrameIndex = -1

    this.state = PlayerState.Destroyed
  }

  // ====== encoders ======
  private async genGifEncoder() {
    const { width, height } = this.getRealFrameSize()
    const GifJs = (await import('gif.js')).default
    return new GifJs({
      debug: import.meta.env.DEV,
      workers: 5,
      workerScript: gifWorkerUrl,
      width,
      height,
    })
  }

  async renderGif(): Promise<Blob> {
    if (!this.canExport) {
      throw new Error(
        'Cannot export: download not complete or assets not ready'
      )
    }

    const encoder = await this.genGifEncoder()
    const frames = this._meta!.frames

    // Prepare HTMLImageElements for gif.js
    const imageList = await Promise.all(
      frames.map((f) => this.getImageAsync(f.file))
    )

    return new Promise<Blob>((resolve, reject) => {
      try {
        imageList.forEach((img, idx) => {
          encoder.addFrame(img, { delay: Math.max(0, frames[idx].delay) })
        })
        encoder.on('finished', (blob: Blob) => {
          // Best-effort worker cleanup (gif.js specific)
          // @ts-ignore
          encoder.freeWorkers?.forEach?.((w: Worker) => w?.terminate?.())
          resolve(blob)
        })
        encoder.on('abort', () => reject(new Error('GIF encoding aborted')))
        encoder.render()
      } catch (e) {
        reject(e as Error)
      }
    })
  }

  async renderMp4() {
    if (!this.canExport) {
      throw new Error(
        'Cannot export: download not complete or assets not ready'
      )
    }

    const { width, height } = this.getRealFrameSize()
    const frames = this._meta!.frames.map((i) => ({
      data: this.getImage(i.file).src!,
      duration: Math.max(0, i.delay),
    }))

    const { encode } = await import('modern-mp4')
    const buf = await encode({ frames, width, height, audio: false })
    return new Blob([buf], { type: 'video/mp4' })
  }
}
