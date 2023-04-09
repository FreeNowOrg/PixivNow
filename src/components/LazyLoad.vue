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
const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const loaded = ref(false)
const error = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)

function init() {
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

let observer: IntersectionObserver
onMounted(async () => {
  await nextTick()
  const img = imgRef.value
  if (!img) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) {
      init()
      observer.disconnect()
    }
  })
  observer.observe(img)
})
onBeforeUnmount(() => {
  observer && observer.disconnect()
})
</script>

<style scoped lang="sass">

.isLoading
  animation: imgProgress 0.6s ease infinite alternate
</style>
