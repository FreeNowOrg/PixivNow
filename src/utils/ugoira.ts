import { unzip } from 'fflate'
import type { UgoiraFrame } from '@/types/Ugoira'
import { ajax } from './ajax'

export type ZipFilesMap = Record<string, Uint8Array>

export async function unzipFromUrl(url: URL | string) {
  const buf = await ajax
    .get(url.toString(), { responseType: 'arraybuffer' })
    .then(({ data }) => data)
  const arr = new Uint8Array(buf)
  const files = await unzipAsync(arr)
  return files
}

async function unzipAsync(payload: Uint8Array) {
  return new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(payload, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

export async function setupUgoira(
  canvas: HTMLCanvasElement,
  files: ZipFilesMap,
  frames: UgoiraFrame[],
  options: {
    mime_type: string
    width: number
    height: number
  }
) {
  const ctx = canvas.getContext('2d')!

  // setup size
  canvas.width = options.width
  canvas.height = options.height

  let cachedObjectUrl: Map<any, string> = new Map()
  let curFrame = 0
  let lastFrameTime = 0

  const getFileUrl = (file: Uint8Array) => {
    if (cachedObjectUrl.has(file)) {
      return cachedObjectUrl.get(file)!
    }
    const url = URL.createObjectURL(
      new Blob([file], { type: options.mime_type })
    )
    cachedObjectUrl.set(file, url)
    return url
  }

  const tick = () => {
    const frame = frames[curFrame]
    const file = files[frame.file]
    const url = getFileUrl(file)
    const delay = frame.delay
    const now = performance.now()
    const delta = now - lastFrameTime
    if (delta > delay) {
      lastFrameTime = now
      curFrame = (curFrame + 1) % frames.length
      const img = new Image()
      img.src = url
      img.onload = () => {
        // 绘制图片，强制占满画布
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
    }
    requestAnimationFrame(tick)
  }

  tick()
}
