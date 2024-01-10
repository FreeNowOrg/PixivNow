<template lang="pug">
svg.loading(v-if='loading')
img(
  :class={ lazyload: true, loaded, error },
  :height='height ?? 100',
  :src='src',
  :width='width ?? 100'
  loading='lazy'
  v-else
)
</template>

<script lang="ts" setup>
const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()
const loading = ref(true)
const loaded = computed(() => !loading.value)
const error = ref(false)

const imgRef = ref<HTMLImageElement>()

const ob = useIntersectionObserver(imgRef, async ([{ isIntersecting }]) => {
  if (isIntersecting) {
    await nextTick()
    loadImage()
    ob.stop()
  }
})

function loadImage() {
  loading.value = true
  error.value = false

  const img = new Image(props.width, props.height)
  img.src = props.src
  img.onload = () => {
    loading.value = false
    error.value = false
    imgRef.value = img
  }
  img.onerror = () => {
    loading.value = false
    error.value = true
  }
}
</script>

<style scoped lang="sass">
.loading
  animation: imgProgress 0.6s ease infinite alternate
</style>
