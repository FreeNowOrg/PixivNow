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
    :menu-trigger='firstLoaded ? "hover" : undefined',
    :right='20',
    :style='{ cursor: isLoading ? "wait" : "pointer", opacity: 0.75 }'
    @click='firstLoaded ? void 0 : handleInit(false)'
    shape='circle'
  )
    template(v-if='firstLoaded')
      NIcon: IDownload
    template(v-else)
      NSpin(size='small' v-if='isLoading')
      NIcon(v-else): IPlay
    template(#menu v-if='firstLoaded')
      NFloatButton(@click='handleJumpToCover'): IImage
      NFloatButton(@click='handleDownloadGif')
        NSpin(size='small' v-if='isLoadingGif')
        NIcon(v-else): IFilm
</template>

<script lang="ts" setup>
import type { Artwork } from '@/types'
import { NSpin, NIcon, NFloatButton, NButton } from 'naive-ui'
import { UgoiraPlayer } from '@/utils/UgoiraPlayer'
import LazyLoad from './LazyLoad.vue'
import IPlay from '~icons/fa-solid/play'
import IPause from '~icons/fa-solid/pause'
import IDownload from '~icons/fa-solid/download'
import IFilm from '~icons/fa-solid/film'
import IImage from '~icons/fa-solid/image'

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

async function handleInit(originalQuality?: boolean) {
  if (isLoading.value) return
  isLoading.value = true

  try {
    player.value.destroy()
    await player.value.fetchMeta()
    await player.value.fetchFrames(originalQuality)
    firstLoaded.value = true
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
    const blob = await player.value.toGif()
    gifBlob.value = blob
    downloadBlob(blob, filename)
  } finally {
    isLoadingGif.value = false
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
</style>
