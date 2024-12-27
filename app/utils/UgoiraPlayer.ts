import type { Artwork } from '../types'
import { unzip } from 'fflate'
import Gif from 'gif.js'
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url'
import { encode as encodeMp4 } from 'modern-mp4'

/**
 * UgoiraPlayer
 * @author dragon-fish
 * @license MIT
 */
export class UgoiraPlayer {
  #canvas?: HTMLCanvasElement
  #illust!: Artwork
  #meta?: UgoiraMeta
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
    this.#canvas = undefined
    this.#illust = illust
  }
  setupCanvas(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
    this.#canvas.width = this.initWidth
    this.#canvas.height = this.initHeight
  }

  get isReady() {
    return !!this.#meta && !!Object.keys(this.files).length
  }
  get isUgoira() {
    return this.#illust.illustType === 2
  }
  get canvas() {
    return this.#canvas
  }
  get illust() {
    return this.#illust
  }
  get meta() {
    return this.#meta
  }
  get totalFrames() {
    return this.#meta?.frames.length ?? 0
  }
  get now() {
    return performance.now()
  }
  get initWidth() {
    return this.#illust.width
  }
  get initHeight() {
    return this.#illust.height
  }
  get mimeType() {
    return this.#meta?.mime_type ?? ''
  }

  async fetchMeta() {
    this.#meta = await $fetch(
      new URL(`/ajax/illust/${this.#illust.id}/ugoira#meta`, location.href)
        .href,
      {
        cache: 'default',
      }
    )
    return this
  }

  async fetchFrames(originalQuality = false) {
    if (!this.#meta) {
      await this.fetchMeta()
    }
    if (!this.#meta) {
      throw new Error('Failed to fetch meta')
    }
    const buf = await $fetch<ArrayBuffer>(
      new URL(
        this.#meta[originalQuality ? 'originalSrc' : 'src'],
        location.href
      ).href,
      {
        cache: 'default',
        responseType: 'arrayBuffer',
      }
    )
    const files = await this.unzipAsync(new Uint8Array(buf))
    this.files = files
    return this
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

  getRealFrameSize() {
    if (!this.isReady) {
      throw new Error('Ugoira assets not ready, please fetch first')
    }
    const firstFrame = this.getImage(this.meta!.frames[0]!.file)
    return {
      width: firstFrame.width,
      height: firstFrame.height,
    }
  }

  private drawFrame() {
    if (!this.canvas || !this.#meta || !this.isPlaying) {
      return
    }
    const ctx = this.canvas.getContext('2d')!
    const frame = this.#meta.frames[this.curFrame]!
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
    this.#meta = undefined
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
    const encoder = this.genGifEncoder()
    const frames = this.#meta!.frames
    const imageList = await Promise.all(
      frames.map((i) => {
        return this.getImage(i.file)
      })
    )
    return new Promise<Blob>((resolve, reject) => {
      imageList.forEach((item, index) => {
        encoder.addFrame(item, { delay: frames[index]!.delay })
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
    const { width, height } = this.getRealFrameSize()
    const frames = this.#meta!.frames.map((i) => {
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
