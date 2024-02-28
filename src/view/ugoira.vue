<template lang="pug">
#ugoira-view
  .controller
    NInputGroup(label='Illust ID')
      NInputNumber(v-model:value='illustId')
      NButton(@click='handleInit') Load Ugoira
  div(:style='{ textAlign: "center" }')
    canvas(ref='canvasRef')
  ul
    li isAgoira: {{ artwork?.illustType === IllustType.UGOIRA }}
    li width: {{ artwork?.width }}
    li height: {{ artwork?.height }}
    li frames: {{ meta?.src }}
</template>

<script lang="ts" setup>
import { NButton, NInputGroup, NInputNumber } from 'naive-ui'
import { setupUgoira, unzipFromUrl } from '@/utils/ugoira'
import { IllustType, type Artwork } from '@/types'
import type { UgoiraMeta } from '@/types/Ugoira'
import { ajax } from '@/utils/ajax'

const canvasRef = ref<HTMLCanvasElement>()
const illustId = ref(116442667)
const artwork = ref<Artwork>()
const meta = ref<UgoiraMeta>()

async function handleInit() {
  artwork.value = await (
    await ajax.get(`/ajax/illust/${illustId.value}?full=1`)
  ).data
  if (artwork.value?.illustType !== IllustType.UGOIRA) {
    console.error(
      'This is not a ugoira',
      artwork.value?.illustType,
      IllustType.UGOIRA
    )
    return
  }
  meta.value = (
    await ajax.get(`/ajax/illust/${illustId.value}/ugoira_meta`)
  ).data
  const files = await unzipFromUrl(meta.value!.src)
  setupUgoira(canvasRef.value!, files, meta.value!.frames, {
    width: artwork.value.width,
    height: artwork.value.height,
    mime_type: meta.value!.mime_type,
  })
}
</script>
