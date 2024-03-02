import { Artwork } from '@/types'
import { unzip } from 'fflate'
import Gif from 'gif.js'
import gifWorker from 'gif.js/dist/gif.worker.js?url'

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

  constructor(illust: Artwork) {
    this.reset(illust)
  }
  reset(illust: Artwork) {
    this.destroy()
    this._canvas = undefined
    this._illust = illust
  }
  setupCanvas(canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._canvas.width = this.initWidth
    this._canvas.height = this.initHeight
  }

  get isReady() {
    return !!this._meta && !!Object.keys(this.files).length
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
    const buf = await fetch(
      new URL(
        this._meta[originalQuality ? 'originalSrc' : 'src'],
        location.href
      ),
      {
        cache: 'default',
      }
    ).then((res) => res.arrayBuffer())
    const files = await this.unzipAsync(new Uint8Array(buf))
    this.files = files
    return this
  }

  private getImage(fileName: string): HTMLImageElement {
    if (this.cachedImages.has(fileName)) {
      return this.cachedImages.get(fileName)!
    }
    const img = new Image()
    img.src = URL.createObjectURL(
      new Blob([this.files[fileName]], { type: this.mimeType })
    )
    this.cachedImages.set(fileName, img)
    return img
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
  }

  genGifEncoder() {
    if (!this.isReady) {
      throw new Error('Ugoira assets not ready, please fetch first')
    }
    const firstFrame = this.getImage(this.meta!.frames[0].file)
    const width = firstFrame.width
    const height = firstFrame.height
    console.info({ width, height })
    return new Gif({
      debug: import.meta.env.DEV,
      workers: 5,
      workerScript: gifWorker,
      width,
      height,
    })
  }
  async toGif(): Promise<Blob> {
    if (!this.isReady) {
      throw new Error('Ugoira assets not ready, please fetch first')
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
