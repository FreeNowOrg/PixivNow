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
const props = defineProps<{
  alt?: string
  src: string
  width?: number
  height?: number
}>()
const loading = ref(true)
const loaded = computed(() => !loading.value)
const error = ref(false)

const containerRef = ref<HTMLDivElement>()
const imgRef = ref<HTMLImageElement>()

const ob = useIntersectionObserver(
  containerRef,
  async ([{ isIntersecting }]) => {
    if (isIntersecting) {
      await nextTick()
      const img = new Image(props.width, props.height)
      img.addEventListener('load', () => {
        loading.value = false
        imgRef.value = img
      })
      img.addEventListener('error', () => {
        loading.value = false
        error.value = true
        imgRef.value = img
      })
      img.src = props.src
      ob.stop()
    }
  }
)
</script>

<style scoped lang="sass">
.loading
  animation: imgProgress 0.6s ease infinite alternate
</style>
