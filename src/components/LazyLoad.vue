<template lang="pug">
Component(
  :class='{ lazyload: true, isLoading: !loaded && !error, isLoaded: loaded, isError: error }',
  :height='height',
  :is='loaded ? "img" : "svg"',
  :src='src',
  :width='width'
  ref='imgRef'
  role='img'
)
</template>

<script lang="ts" setup>
import { getElementUntilIntoView } from '@/utils/getElementUntilIntoView'

const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const loaded = ref(false)
const error = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

async function init() {
  loaded.value = false
  error.value = false

  await nextTick()
  const el = imgRef.value!
  await getElementUntilIntoView(el)

  const img = new Image(props.width, props.height)
  img.src = props.src
  img.onload = () => {
    loaded.value = true
    error.value = false
    imgRef.value = img
  }
  img.onerror = () => {
    loaded.value = false
    error.value = true
  }
}

onMounted(init)
watch(props, init)
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
</style>
