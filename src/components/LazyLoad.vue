<template lang="pug">
img(
  :class='{ lazyload: true, isLoading: !loaded && !error, isLoaded: loaded, isError: error }',
  :height='height',
  :is='error ? "svg" : "img"',
  :key='src',
  :src='src',
  :width='width'
  loading='lazy'
  ref='imgRef'
)
</template>

<script lang="ts" setup>
const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const loaded = ref(false)
const error = ref(false)
const imgRef = useTemplateRef('imgRef')

watch(
  () => props.src,
  () => {
    loaded.value = false
    error.value = false
  }
)

useEventListener(imgRef, 'load', () => {
  loaded.value = true
  error.value = false
})
useEventListener(imgRef, 'error', (e) => {
  console.warn('error', e)
  loaded.value = false
  error.value = true
})
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
.isError
  background-color: #e8e8e8
</style>
