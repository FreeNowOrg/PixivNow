<template lang="pug">
Component(
  :class='{ lazyload: true, isLoading: !loaded && !error, isLoaded: loaded, isError: error }',
  :height='height',
  :is='loaded ? "img" : "svg"',
  :key='src',
  :src='src',
  :width='width'
  ref='elRef'
  role='img'
)
</template>

<script lang="ts" setup>
import { observeLazy, unobserveLazy } from '~/composables/useSharedObserver'

const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const loaded = ref(false)
const error = ref(false)
const elRef = ref<HTMLElement | null>(null)

function loadImage() {
  loaded.value = false
  error.value = false

  const img = new Image(props.width, props.height)
  img.src = props.src
  img.onload = () => {
    loaded.value = true
    error.value = false
  }
  img.onerror = () => {
    loaded.value = false
    error.value = true
  }
}

onMounted(() => {
  const el = elRef.value
  if (el) observeLazy(el, loadImage)
})

onBeforeUnmount(() => {
  const el = elRef.value
  if (el) unobserveLazy(el)
})
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
.isError
  background-color: var(--fnb-skeleton)
</style>
