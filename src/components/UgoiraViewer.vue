<template lang="pug">
#ugoira-viewer
  canvas.media(
    :height='illust?.height',
    :width='illust.width'
    ref='canvasRef'
    v-if='firstLoaded'
  )
  LazyLoad.media(
    :height='illust.height',
    :src='illust.urls.regular',
    :style='{ cursor: isLoading ? "wait" : "pointer" }',
    :width='illust.width'
    @click='handleInit(false)'
    v-else
  )
  NFloatButton(
    :bottom='20',
    :menu-trigger='"hover"',
    :right='20',
    :style='{ cursor: isLoading ? "wait" : "pointer", opacity: 0.75 }'
    shape='circle'
  )
    //- button
    template(v-if='!firstLoaded')
      NSpin(size='small' v-if='isLoading')
      NIcon(v-else): IPlay
    template(v-else)
      NIcon: IDownload
    //- menu
    template(#menu v-if='!firstLoaded')
      NFloatButton(@click='handleInit(true)' title='加载原画' v-if='!isLoading')
        IconPhotoSpark
      NFloatButton(@click='handleInit(false)' title='加载普通画质')
        NSpin(size='small' v-if='isLoading')
        IconPhotoScan(v-else)
    template(#menu v-if='firstLoaded')
      NFloatButton(@click='handleJumpToCover' title='查看封面'): IconPhotoDown
      NFloatButton(@click='handleDownloadGif' title='下载GIF')
        NSpin(size='small' v-if='isLoadingGif')
        template(v-else): IconGif
      NFloatButton(@click='handleDownloadMp4' title='下载MP4')
        NSpin(size='small' v-if='isLoadingMp4')
        template(v-else): IconMovie
      NFloatButton(@click='handleInit(true)' title='加载原画' v-if='!isHQLoaded') 
        NSpin(size='small' v-if='isLoading')
        template(v-else): IconPhotoSpark

  .badge {{ firstLoaded ? (isHQLoaded ? 'HQ' : 'LQ') : 'Cover' }}
</template>

<script lang="ts" setup>
import type { Artwork } from '@/types'
import { NSpin, NIcon, NFloatButton, NButton } from 'naive-ui'
import { UgoiraPlayer } from '@/utils/UgoiraPlayer'
import LazyLoad from './LazyLoad.vue'
import IPlay from '~icons/fa-solid/play'
import IPause from '~icons/fa-solid/pause'
import IDownload from '~icons/fa-solid/download'
import {
  IconCamera,
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

const firstLoaded = ref(false)
const isLoading = ref(false)
const canvasRef = ref<HTMLCanvasElement>()
const player = computed(() => {
  const p = new UgoiraPlayer(props.illust)
  emit('on:player', p)
  return p
})
const isPlaying = ref(true)

const isHQLoaded = ref(false)
async function handleInit(originalQuality?: boolean) {
  if (isLoading.value) return
  isLoading.value = true

  try {
    player.value.destroy()
    await player.value.fetchMeta()
    await player.value.fetchFrames(originalQuality)
    firstLoaded.value = true
    if (originalQuality) isHQLoaded.value = true
    await nextTick()
    player.value.setupCanvas(canvasRef.value!)
    player.value.play()
  } finally {
    isLoading.value = false
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
  const filename = `${props.illust.illustId}.ugoira.gif`

  if (gifBlob.value) {
    downloadBlob(gifBlob.value, filename)
    return
  }

  if (isLoadingGif.value) return
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
  const filename = `${props.illust.illustId}.ugoira.mp4`

  if (mp4Blob.value) {
    downloadBlob(mp4Blob.value, filename)
    return
  }

  if (isLoadingMp4.value) return
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
</script>

<style scoped lang="sass">
#ugoira-viewer
  display: inline-block
  position: relative
  transform: translate(0)
  line-height: 0

.media
  border-radius: 4px
  box-shadow: var(--theme-box-shadow)
  transition: box-shadow 0.24s ease-in-out
  max-width: 100%
  max-height: 60vh
  width: auto
  height: auto
  &:hover
    box-shadow: var(--theme-box-shadow-hover)

.controller
  position: absolute
  bottom: 1rem
  right: 1rem

.badge
  color: #999
  font-size: 0.6rem
  background: rgba(150, 150, 150, 0.25)
  padding: 0.1rem 0.25rem
  border-radius: 0.2rem
  position: absolute
  right: 0.25rem
  bottom: 0.25rem
  line-height: 1
  user-select: none
  pointer-events: none
  z-index: 1
</style>
