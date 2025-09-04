<template lang="pug">
Component(
  :class='{ lazyload: true, isLoading: !loaded && !error, isLoaded: loaded, isError: error }',
  :height='height',
  :is='loaded ? "img" : "svg"',
  :key='src',
  :src='src',
  :width='width'
  ref='imgRef'
  role='img'
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
const imgRef = ref<HTMLImageElement | null>(null)

const ob = useIntersectionObserver(imgRef, async ([{ isIntersecting }]) => {
  if (isIntersecting) {
    await nextTick()
    loadImage()
    ob.stop()
  }
})

function loadImage() {
  loaded.value = false
  error.value = false

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
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
.isError
  background-color: #e8e8e8
</style>
