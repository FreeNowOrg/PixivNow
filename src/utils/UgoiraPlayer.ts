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
  private files: Record<string, Uint8Array> = {}
  private zipDownloader?: ZipDownloader
  private downloadProgress = 0
  private isDownloading = false
  private isDownloadComplete = false
  private downloadStartTime = 0
  private frameDownloadTimes: number[] = []

  constructor(
    illust: Artwork,
    public options: UgoiraPlayerOptions = {}
  ) {
    this.reset(illust)
    if (options) {
      this.options = options
    }
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
   * 使用 ZipDownloader 优化的帧下载方法
   * 1. 首先拉取zip的元信息，确定文件分片情况
   * 2. 根据UgoiraMeta的frame信息，依次下载文件
   * 3. 下载完一张图片时：如果下载用时大于前一帧的delay，立即渲染到canvas，否则等待delay后渲染到canvas
   * 4. 全部帧下载完毕，开始按照frame的定义正常循环播放动画，标记为可以导出为gif或mp4
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

      // 1. 创建 ZipDownloader 并获取元信息
      this.zipDownloader = new ZipDownloader(zipUrl, {
        chunkSize: 128 * 1024,
        maxConcurrentRequests: 3,
        tryDecompress: true,
        timeoutMs: 10000,
        retries: 2,
        ...this.options.zipDownloaderOptions,
      })

      console.log('[UgoiraPlayer] 开始获取 ZIP 元信息...')
      const overview = await this.zipDownloader.getCentralDirectory()
      console.log('[UgoiraPlayer] ZIP 元信息获取完成:', {
        entryCount: overview.entryCount,
        entries: overview.entries.map((e) => e.fileName),
      })

      // 2. 根据 UgoiraMeta 的 frame 信息，依次下载文件
      const frames = this._meta!.frames
      const totalFrames = frames.length

      for (let i = 0; i < totalFrames; i++) {
        const frame = frames[i]
        const frameStartTime = performance.now()

        try {
          // 下载单个帧文件
          const result = await this.zipDownloader.downloadByPath(frame.file)
          this.files[frame.file] = result.bytes

          const frameDownloadTime = performance.now() - frameStartTime
          this.frameDownloadTimes[i] = frameDownloadTime

          // 更新下载进度
          this.downloadProgress = ((i + 1) / totalFrames) * 100

          console.log(`[UgoiraPlayer] 帧 ${i + 1}/${totalFrames} 下载完成:`, {
            fileName: frame.file,
            downloadTime: frameDownloadTime,
            delay: frame.delay,
            progress: this.downloadProgress.toFixed(1) + '%',
          })

          // 触发进度回调
          this.options.onDownloadProgress?.(
            this.downloadProgress,
            i,
            totalFrames
          )

          // 3. 智能渲染逻辑：根据下载时间与delay比较决定立即渲染或等待
          await this.handleFrameRender(i, frame, frameDownloadTime)
        } catch (error) {
          console.error(`[UgoiraPlayer] 帧 ${i + 1} 下载失败:`, error)
          throw new Error(`Failed to download frame ${i + 1}: ${frame.file}`)
        }
      }

      // 4. 全部帧下载完毕，标记为可以导出
      this.isDownloadComplete = true
      this.isDownloading = false

      const totalDownloadTime = performance.now() - this.downloadStartTime
      console.log('[UgoiraPlayer] 所有帧下载完成:', {
        totalFrames,
        totalDownloadTime: totalDownloadTime.toFixed(2) + 'ms',
        averageFrameTime: (totalDownloadTime / totalFrames).toFixed(2) + 'ms',
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
    if (!this._canvas) {
      return // 没有canvas，跳过渲染
    }

    const ctx = this._canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // 获取前一帧的delay（第一帧没有前一帧，使用当前帧的delay）
    const previousDelay =
      frameIndex > 0 ? this._meta!.frames[frameIndex - 1].delay : frame.delay

    // 如果下载时间大于前一帧的delay，立即渲染
    if (downloadTime > previousDelay) {
      console.log(
        `[UgoiraPlayer] 帧 ${frameIndex + 1} 下载时间(${downloadTime.toFixed(2)}ms) > 前一帧delay(${previousDelay}ms)，立即渲染`
      )
      await this.renderFrameToCanvas(frameIndex, frame)
    } else {
      // 否则等待delay后渲染
      const waitTime = previousDelay - downloadTime
      console.log(
        `[UgoiraPlayer] 帧 ${frameIndex + 1} 下载时间(${downloadTime.toFixed(2)}ms) <= 前一帧delay(${previousDelay}ms)，等待${waitTime.toFixed(2)}ms后渲染`
      )

      await new Promise((resolve) => setTimeout(resolve, waitTime))
      await this.renderFrameToCanvas(frameIndex, frame)
    }
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
    img.src = URL.createObjectURL(new Blob([buf], { type: this.mimeType }))
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
    img.src = URL.createObjectURL(new Blob([buf], { type: this.mimeType }))
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
    this.cachedImages.clear()
    this.files = {}
    this._meta = undefined
    this.zipDownloader = undefined
    this.isDownloading = false
    this.isDownloadComplete = false
    this.downloadProgress = 0
    this.downloadStartTime = 0
    this.frameDownloadTimes = []
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
