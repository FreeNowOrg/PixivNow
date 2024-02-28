<template lang="pug">
#ugoira-view
  .controller
    NInputGroup(label='Illust ID')
      NInputNumber(v-model:value='illustId')
      NButton(@click='handleInit(false)' type='primary') Load Illust
  div(:style='{ textAlign: "center" }')
    UgoiraViewer(:illust='illust' @player='player = $event' v-if='illust')
</template>

<script lang="ts" setup>
import { NButton, NInputGroup, NInputNumber } from 'naive-ui'
import { UgoiraPlayer, type UgoiraMeta } from '@/utils/UgoiraPlayer'
import { IllustType, type Artwork } from '@/types'
import UgoiraViewer from '@/components/UgoiraViewer.vue'
import { ajax } from '@/utils/ajax'

const illustId = ref(116442667)
const illust = ref<Artwork>()
const meta = ref<UgoiraMeta>()
const isLoading = ref(false)
const player = ref<UgoiraPlayer>()

async function handleInit(originalQuality?: boolean) {
  illust.value = undefined
  meta.value = undefined
  isLoading.value = true

  illust.value = await (
    await ajax.get(`/ajax/illust/${illustId.value}?full=1`)
  ).data

  isLoading.value = false
}
</script>
