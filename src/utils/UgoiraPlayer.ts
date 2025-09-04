import { Artwork } from '@/types'
import { unzip } from 'fflate'
import Gif from 'gif.js'
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url'
import { encode as encodeMp4 } from 'modern-mp4'
import { ZipDownloader, ZipDownloaderOptions } from './ZipDownloader'

export interface UgoiraPlayerOptions {
  onDownloadProgress?: (
    progress: number,
    frameIndex: number,
    totalFrames: number
  ) => void
  onDownloadComplete?: () => void
  onDownloadError?: (error: Error) => void
  zipDownloaderOptions?: ZipDownloaderOptions
}

/**
 * UgoiraPlayer
 * @author dragon-fish
 * @license MIT
 */
export class UgoiraPlayer {
  private _canvas?: HTMLCanvasElement
  private _illust!: Artwork
  private _meta?: UgoiraMeta
  private isPlaying = false
  private curFrame = 0
  private lastFrameTime = 0
  private cachedImages: Map<string, HTMLImageElement> = new Map()
  private objectURLs: Set<string> = new Set() // 跟踪所有创建的 objectURL
  private files: Record<string, Uint8Array> = {}
  private zipDownloader?: ZipDownloader
  private downloadProgress = 0
  private isDownloading = false
  private isDownloadComplete = false
  private downloadStartTime = 0
  private frameDownloadTimes: number[] = []
  private frameReady: boolean[] = []
  // 新增: 上一次已经渲染的帧索引（初始为 -1）
  private lastRenderedFrameIndex = -1
  // 新增: 当前顺序播放的定时器 id
  private renderTimer: number | undefined

  constructor(
    illust: Artwork,
    public options: UgoiraPlayerOptions = {}
  ) {
    this.reset(illust)
  }
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
    if (this.renderTimer) {
      clearTimeout(this.renderTimer)
      this.renderTimer = undefined
    }
  }
  setupCanvas(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._canvas.width = this.initWidth
    this._canvas.height = this.initHeight
  }

  get isReady() {
    return !!this._meta && !!Object.keys(this.files).length
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

    // 使用 ZipDownloader 进行优化下载
    return this.fetchFramesOptimized(originalQuality)
  }

  /**
   * 使用 ZipDownloader.streamingDownload 优化的帧下载方法
   * 1. 使用流式下载模式，从头开始下载整个zip
   * 2. 每完成一个文件就触发回调，立即处理该帧
   * 3. 根据下载时间与delay比较决定立即渲染或等待
   * 4. 全部帧下载完毕，标记为可以导出为gif或mp4
   */
  private async fetchFramesOptimized(originalQuality = false) {
    if (this.isDownloading) {
      throw new Error('Download already in progress')
    }

    this.isDownloading = true
    this.downloadStartTime = performance.now()
    this.downloadProgress = 0
    this.frameDownloadTimes = []

    try {
      const zipUrl = new URL(
        this._meta![originalQuality ? 'originalSrc' : 'src'],
        location.href
      ).href

      if (!this.zipDownloader) {
        this.zipDownloader = new ZipDownloader('')
      }
      this.zipDownloader.setUrl(zipUrl).setOptions({
        chunkSize: 512 * 1024,
        maxConcurrentRequests: 4,
        tryDecompress: true,
        timeoutMs: 10000,
        retries: 2,
        ...this.options.zipDownloaderOptions,
      })

      console.log('[UgoiraPlayer] 开始流式下载 ZIP...')

      // 2. 使用流式下载，按物理顺序获取所有文件
      const { frames } = this._meta!
      const totalFrames = frames.length
      let processedFrames = 0
      // 初始化 frameReady 状态数组
      this.frameReady = new Array(totalFrames).fill(false)
      this.lastRenderedFrameIndex = -1

      const result = await this.zipDownloader.streamingDownload({
        onFileComplete: (entryWithData, info) => {
          // 查找对应的帧信息
          const frameIndex = frames.findIndex(
            (f) => f.file === entryWithData.fileName
          )
          if (frameIndex === -1) {
            console.warn(
              `[UgoiraPlayer] 未找到对应帧: ${entryWithData.fileName}`
            )
            return
          }

          const frame = frames[frameIndex]

          // 存储文件数据
          this.files[frame.file] = entryWithData.data

          // 记录下载时间
          const frameDownloadTime = info.downloadTime
          this.frameDownloadTimes[frameIndex] = frameDownloadTime
          processedFrames++

          // 更新下载进度
          this.downloadProgress = (processedFrames / totalFrames) * 100

          console.log(
            `[UgoiraPlayer] 帧 ${frameIndex + 1}/${totalFrames} 下载完成:`,
            {
              fileName: frame.file,
              downloadTime: frameDownloadTime,
              delay: frame.delay,
              progress: this.downloadProgress.toFixed(1) + '%',
              mimeType: info.mimeType,
            }
          )

          // 触发进度回调
          this.options.onDownloadProgress?.(
            this.downloadProgress,
            frameIndex,
            totalFrames
          )
          // 标记该帧已就绪并尝试调度渲染
          this.frameReady[frameIndex] = true
          this.scheduleNextFrame()
        },
        onProgress: (downloadedBytes, contentLength) => {
          // 可以在这里添加更细粒度的下载进度回调
          console.log(
            `[UgoiraPlayer] ZIP 下载进度: ${((downloadedBytes / contentLength) * 100).toFixed(1)}%`
          )
        },
      })

      console.log(`[UgoiraPlayer] 流式下载完成:`, {
        totalFiles: result.totalFiles,
        completedFiles: result.completedFiles,
        entries: result.entries.length,
      })

      // 4. 全部帧下载完毕，标记为可以导出
      this.isDownloadComplete = true
      this.isDownloading = false

      const totalDownloadTime = performance.now() - this.downloadStartTime
      console.log('[UgoiraPlayer] 所有帧下载完成:', {
        totalFrames: processedFrames,
        totalDownloadTime: totalDownloadTime.toFixed(2) + 'ms',
        averageFrameTime:
          processedFrames > 0
            ? (totalDownloadTime / processedFrames).toFixed(2) + 'ms'
            : '0ms',
        canExport: this.canExport,
      })

      // 触发完成回调
      this.options.onDownloadComplete?.()

      return this
    } catch (error) {
      this.isDownloading = false
      console.error('[UgoiraPlayer] 下载过程出错:', error)

      // 触发错误回调
      this.options.onDownloadError?.(error as Error)

      throw error
    }
  }

  /**
   * 处理帧渲染逻辑
   * 如果下载用时大于前一帧的delay，立即渲染到canvas，否则等待delay后渲染到canvas
   */
  private async handleFrameRender(
    frameIndex: number,
    frame: UgoiraFrame,
    downloadTime: number
  ) {
    // 已弃用的即时/等待渲染逻辑，保留方法签名避免外部引用报错
    console.warn('[UgoiraPlayer] handleFrameRender 已被顺序调度替换')
  }

  /**
   * 顺序调度渲染：
   * 从 lastRenderedFrameIndex + 1 开始，找到第一个未渲染但已就绪的连续帧，
   * 逐帧按其自身 delay 排队渲染，中途如果有缺失（未下载的帧）则暂停等待。
   */
  private scheduleNextFrame() {
    if (!this._canvas || !this._meta) return
    // 如果已有定时器在等待，不重复调度
    if (this.renderTimer) return

    const { frames } = this._meta
    const nextIndex = this.lastRenderedFrameIndex + 1
    // 如果下一帧未准备好，等待其就绪（由 onFileComplete 再次调用）
    if (!this.frameReady[nextIndex]) return

    const renderSequential = async () => {
      while (true) {
        const idx = this.lastRenderedFrameIndex + 1
        if (idx >= frames.length) {
          // 所有帧已渲染
          this.renderTimer = undefined
          return
        }
        if (!this.frameReady[idx]) {
          // 遇到缺口，停止循环，等待后续下载完成再调度
          this.renderTimer = undefined
          return
        }
        const frame = frames[idx]
        await this.renderFrameToCanvas(idx, frame)
        this.lastRenderedFrameIndex = idx
        // 安排下一帧的 delay
        await new Promise<void>((resolve) => {
          this.renderTimer = window.setTimeout(() => {
            this.renderTimer = undefined
            resolve()
          }, frame.delay)
        })
      }
    }

    renderSequential().catch((e) => {
      console.error('[UgoiraPlayer] 顺序渲染出错:', e)
      this.renderTimer = undefined
    })
  }

  /**
   * 将指定帧渲染到canvas
   */
  private async renderFrameToCanvas(frameIndex: number, frame: UgoiraFrame) {
    if (!this._canvas) return

    const ctx = this._canvas.getContext('2d')
    if (!ctx) return

    try {
      const img = await this.getImageAsync(frame.file)
      ctx.drawImage(img, 0, 0, this.initWidth, this.initHeight)
      console.log(`[UgoiraPlayer] 帧 ${frameIndex + 1} 已渲染到canvas`)
    } catch (error) {
      console.error(`[UgoiraPlayer] 帧 ${frameIndex + 1} 渲染失败:`, error)
    }
  }

  private getImage(fileName: string): HTMLImageElement {
    if (this.cachedImages.has(fileName)) {
      return this.cachedImages.get(fileName)!
    }
    const buf = this.files[fileName]
    if (!buf) {
      throw new Error(`File ${fileName} not found`)
    }
    const img = new Image()
    const objectURL = URL.createObjectURL(
      new Blob([new Uint8Array(buf)], { type: this.mimeType })
    )
    this.objectURLs.add(objectURL)
    img.src = objectURL
    this.cachedImages.set(fileName, img)
    return img
  }

  private async getImageAsync(fileName: string): Promise<HTMLImageElement> {
    if (this.cachedImages.has(fileName)) {
      const img = this.cachedImages.get(fileName)!
      // 如果图片已经加载完成，直接返回
      if (img.complete && img.naturalWidth > 0) {
        return img
      }
      // 否则等待加载完成
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = reject
      })
    }

    const buf = this.files[fileName]
    if (!buf) {
      throw new Error(`File ${fileName} not found`)
    }

    const img = new Image()
    const objectURL = URL.createObjectURL(
      new Blob([new Uint8Array(buf)], { type: this.mimeType })
    )
    this.objectURLs.add(objectURL)
    img.src = objectURL
    this.cachedImages.set(fileName, img)

    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = reject
    })
  }

  getRealFrameSize() {
    if (!this.isReady) {
      throw new Error('Ugoira assets not ready, please fetch first')
    }
    const firstFrame = this.getImage(this.meta!.frames[0].file)
    return {
      width: firstFrame.width,
      height: firstFrame.height,
    }
  }

  private drawFrame() {
    if (!this.canvas || !this._meta || !this.isPlaying) {
      return
    }
    const ctx = this.canvas.getContext('2d')!
    const frame = this._meta.frames[this.curFrame]
    const delay = frame.delay
    const now = this.now
    const delta = now - this.lastFrameTime
    if (delta > delay) {
      this.lastFrameTime = now
      this.curFrame = (this.curFrame + 1) % this.totalFrames
    }
    const img = this.getImage(frame.file)
    ctx.drawImage(img, 0, 0, this.initWidth, this.initHeight)
    requestAnimationFrame(() => this.drawFrame())
  }

  play() {
    this.isPlaying = true
    this.lastFrameTime = this.now
    this.drawFrame()
  }

  pause() {
    this.isPlaying = false
  }

  destroy() {
    this.pause()

    if (this.renderTimer) {
      clearTimeout(this.renderTimer)
      this.renderTimer = undefined
    }

    // 清理所有 objectURL 防止内存泄漏
    this.objectURLs.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    this.objectURLs.clear()

    this.cachedImages.clear()
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
  }

  private genGifEncoder() {
    const { width, height } = this.getRealFrameSize()
    return new Gif({
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

    const encoder = this.genGifEncoder()
    const frames = this._meta!.frames
    const imageList = await Promise.all(
      frames.map((i) => {
        return this.getImage(i.file)
      })
    )
    return new Promise<Blob>((resolve, reject) => {
      imageList.forEach((item, index) => {
        encoder.addFrame(item, { delay: frames[index].delay })
      })
      encoder.on('finished', async (blob) => {
        console.info('[ENCODER]', 'render finished', encoder)
        // FIXME: 渲染结束时释放内存
        // @ts-ignore
        encoder.freeWorkers?.forEach((worker: Worker) => {
          worker && worker.terminate()
        })
        resolve(blob)
      })
      console.info('[ENCODER]', 'render start', encoder)
      encoder.render()
    })
  }

  async renderMp4() {
    if (!this.canExport) {
      throw new Error(
        'Cannot export: download not complete or assets not ready'
      )
    }

    const { width, height } = this.getRealFrameSize()
    const frames = this._meta!.frames.map((i) => {
      return {
        data: this.getImage(i.file).src!,
        duration: i.delay,
      }
    })
    console.info({ width, height, frames })
    const buf = await encodeMp4({
      frames,
      width,
      height,
      audio: false,
    })
    const blob = new Blob([buf], { type: 'video/mp4' })
    return blob
  }

  async unzipAsync(payload: Uint8Array) {
    return new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      unzip(payload, (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }
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
