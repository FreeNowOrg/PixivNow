<template lang="pug">
#ugoira-viewer
  canvas.media(
    :height='illust?.height',
    :width='illust.width'
    ref='canvasRef'
    v-if='firstLoaded'
  )
  DeferLoad.media(
    :height='illust.height',
    :src='illust.urls.regular',
    :style='{ cursor: isLoading ? "wait" : "pointer" }',
    :width='illust.width'
    @click='handleInit(false)'
    loading='lazy'
    v-else
  )
  FnbProgress(
    :height='6',
    :percentage='+downloadProgress.toFixed(2)',
    :style='{ left: 0, right: 0, position: "absolute", ...(isLoading ? { top: "calc(100% + 4px)", opacity: "1", transitionDuration: "0.25s" } : { top: "calc(100% - 4px)", opacity: "0", transitionDelay: "3s", transitionDuration: "0.5s" }) }'
  )
  FnbFloatButton(
    :bottom='20',
    :right='20',
    :style='{ cursor: isLoading ? "wait" : "pointer", opacity: 0.75 }'
  )
    //- main button
    template(v-if='!firstLoaded')
      svg.spin-icon(v-if='isLoading' viewBox='0 0 24 24' width='20' height='20')
        circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
      IPlay(v-else)
    template(v-else)
      IDownload
    //- menu (before first load)
    template(#menu v-if='!firstLoaded')
      button.ugoira-menu-btn(@click='handleInit(true)' title='加载原画' v-if='!isLoading')
        IconPhotoSpark
      button.ugoira-menu-btn(@click='handleInit(false)' title='加载普通画质')
        svg.spin-icon(v-if='isLoading' viewBox='0 0 24 24' width='20' height='20')
          circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
        IconPhotoScan(v-else)
    //- menu (after first load)
    template(#menu v-if='firstLoaded')
      button.ugoira-menu-btn(@click='handleJumpToCover' title='查看封面'): IconPhotoDown
      button.ugoira-menu-btn(@click='handleDownloadGif' title='下载GIF')
        svg.spin-icon(v-if='isLoadingGif || isLoading' viewBox='0 0 24 24' width='20' height='20')
          circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
        template(v-else): IconGif
      button.ugoira-menu-btn(@click='handleDownloadMp4' title='下载MP4')
        svg.spin-icon(v-if='isLoadingMp4 || isLoading' viewBox='0 0 24 24' width='20' height='20')
          circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
        template(v-else): IconMovie
      button.ugoira-menu-btn(@click='handleInit(true)' title='加载原画' v-if='!isHQLoaded')
        svg.spin-icon(v-if='isLoading' viewBox='0 0 24 24' width='20' height='20')
          circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
        template(v-else): IconPhotoSpark

  .badge {{ firstLoaded ? (isHQLoaded ? 'HQ' : 'NQ') : 'Cover' }}
</template>

<script lang="ts" setup>
import type { Artwork } from '~/types'
import { UgoiraPlayer } from '~/utils/UgoiraPlayer'
import DeferLoad from './DeferLoad.vue'
import IPlay from '~icons/fa-solid/play'
import IDownload from '~icons/fa-solid/download'
import {
  IconGif,
  IconMovie,
  IconPhotoScan,
  IconPhotoSpark,
  IconPhotoDown,
} from '@tabler/icons-vue'

const props = defineProps<{
  illust: Artwork
}>()
const emit = defineEmits<{
  'on:player': [UgoiraPlayer]
}>()

const toast = useToast()

const firstLoaded = ref(false)
const isLoading = ref(false)
const canvasRef = ref<HTMLCanvasElement>()
const downloadProgress = ref(0)
const player = computed(() => {
  const p = new UgoiraPlayer(props.illust, {
    onDownloadProgress: (progress, frameIndex, totalFrames) => {
      downloadProgress.value = progress
      console.log(
        `下载进度: ${progress.toFixed(1)}% (${frameIndex + 1}/${totalFrames})`
      )
    },
    onDownloadComplete: () => {
      console.log('所有帧下载完成')
      isLoading.value = false
    },
    onDownloadError: (error) => {
      console.error('下载失败:', error)

      // 下载失败后还原状态，让用户可以重新尝试
      firstLoaded.value = false
      isHQLoaded.value = false
      downloadProgress.value = 0
      isLoading.value = false

      // 清理播放器状态
      p.destroy()

      toast.warning('Ugoira 下载失败，请重试')
    },
  })
  emit('on:player', p)
  return p
})
const isPlaying = ref(true)

const isHQLoaded = ref(false)
async function handleInit(originalQuality?: boolean) {
  if (isLoading.value) return
  isLoading.value = true
  downloadProgress.value = 0

  try {
    player.value.destroy()
    await player.value.fetchMeta()

    // 立即设置 canvas 和标记为已加载，这样下载过程中就可以开始渲染
    firstLoaded.value = true
    if (originalQuality) isHQLoaded.value = true
    await nextTick()
    player.value.setupCanvas(canvasRef.value!)

    // 开始下载帧，下载过程中会自动渲染到 canvas
    await player.value.fetchFrames(originalQuality)

    // 下载完成后开始正常播放
    player.value.play()
  } catch (error) {
    console.error('Ugoira 初始化失败:', error)

    // 初始化失败后还原状态，让用户可以重新尝试
    firstLoaded.value = false
    isHQLoaded.value = false
    downloadProgress.value = 0
    isLoading.value = false

    // 清理播放器状态
    player.value.destroy()

    toast.error('Ugoira 初始化失败，请重试')
  }
}

function handlePause() {
  if (isPlaying.value) {
    player.value.pause()
  } else {
    player.value.play()
  }
  isPlaying.value = !isPlaying.value
}

function handleJumpToCover() {
  const a = document.createElement('a')
  a.href = props.illust.urls.original
  a.target = '_blank'
  a.click()
}

const isLoadingGif = ref(false)
const gifBlob = ref<Blob>()
async function handleDownloadGif() {
  if (!player.value.canExport) return
  const filename = `${props.illust.illustId}.ugoira.gif`

  if (gifBlob.value) {
    downloadBlob(gifBlob.value, filename)
    return
  }

  if (isLoadingGif.value) return

  // 检查是否可以导出
  if (!player.value.canExport) {
    console.warn('下载未完成，无法导出 GIF')
    return
  }

  isLoadingGif.value = true

  try {
    const blob = await player.value.renderGif()
    gifBlob.value = blob
    downloadBlob(blob, filename)
  } finally {
    isLoadingGif.value = false
  }
}

const isLoadingMp4 = ref(false)
const mp4Blob = ref<Blob>()
async function handleDownloadMp4() {
  if (!player.value.canExport) return
  const filename = `${props.illust.illustId}.ugoira.mp4`

  if (mp4Blob.value) {
    downloadBlob(mp4Blob.value, filename)
    return
  }

  if (isLoadingMp4.value) return

  // 检查是否可以导出
  if (!player.value.canExport) {
    console.warn('下载未完成，无法导出 MP4')
    return
  }

  isLoadingMp4.value = true

  try {
    const blob = await player.value.renderMp4()
    mp4Blob.value = blob
    downloadBlob(blob, filename)
  } finally {
    isLoadingMp4.value = false
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

onBeforeUnmount(() => {
  player.value.destroy()
})
</script>

<style scoped lang="scss">
#ugoira-viewer {
  display: inline-block;
  position: relative;
  transform: translate(0);
  line-height: 0;
}

.media {
  border-radius: var(--fnb-radius);
  @include fnb-border;
  @include fnb-shadow-sm;
  transition: box-shadow 0.24s ease-in-out;
  max-width: 100%;
  max-height: 60vh;
  width: auto;
  height: auto;
  &:hover {
    box-shadow: var(--fnb-shadow);
  }
}

.controller {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.badge {
  color: #999;
  font-size: 0.6rem;
  background: rgba(150, 150, 150, 0.25);
  padding: 0.1rem 0.25rem;
  border-radius: var(--fnb-radius);
  position: absolute;
  right: 0.25rem;
  top: 0.25rem;
  line-height: 1;
  user-select: none;
  pointer-events: none;
  z-index: 1;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.ugoira-menu-btn {
  @include fnb-border;
  @include fnb-shadow-sm;
  @include fnb-press;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fnb-surface);
  cursor: pointer;
  font-size: 1.25rem;
  border-radius: var(--fnb-radius);
  color: var(--fnb-text);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
