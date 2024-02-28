/**
 * @author dragon-fish (d.ts file)
 * @refer source code from https://github.com/pixiv/zip_player/blob/e1f21d6095e79f7f7de1d79e4ed7acbc2e27a652/zip_player.js
 * @desc This module seems to be too old and it doesn't work as expected
 */

export interface ZipImagePlayer {
  new (options: ZipImagePlayerOptions): ZipImagePlayer
  files: ZipFilesMap
  frameCount: number
  frameRate: number
  width: number
  height: number
  loop: boolean
  play: (canvas: HTMLCanvasElement, onFrame: (frame: number) => void) => void
  stop: () => void
  dispose: () => void
}
export interface ZipImagePlayerOptions {
  canvas: HTMLCanvasElement
  source: string
  metadata: { frames: any[]; mime_type: string }
  autoStart: boolean
  loop: boolean
  debug: boolean
  chunkSize: number
  autosize: boolean
}
declare module './zip_player.js' {
  export const ZipImagePlayer: ZipImagePlayer
}
