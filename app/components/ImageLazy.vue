<template lang="pug">
.lazy(ref='containerRef')
  svg.loading(v-if='loading')
  img(
    :alt='alt ?? ""',
    :class='{ img: true, lazyload: true, loaded, error }',
    :height='height ?? 100',
    :src='src',
    :width='width ?? 100'
    loading='lazy'
    ref='imgRef'
    v-else
  )
</template>

<script lang="ts" setup>
const { src, width, height } = defineProps<{
  alt?: string
  src: string
  width?: number
  height?: number
}>()
const loading = ref(true)
const loaded = computed(() => !loading.value)
const error = ref(false)

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
const imgRef = ref<HTMLImageElement>()

const ob = useIntersectionObserver(containerRef, async ([entry]) => {
  if (entry?.isIntersecting) {
    await nextTick()
    const img = new Image(width, height)
    img.addEventListener('load', () => {
      loading.value = false
      imgRef.value = img
    })
    img.addEventListener('error', () => {
      loading.value = false
      error.value = true
      imgRef.value = img
    })
    img.src = src
    ob.stop()
  }
})
</script>

<style scoped lang="sass">
.loading
  animation: imgProgress 0.6s ease infinite alternate
</style>
