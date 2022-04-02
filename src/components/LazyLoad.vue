<template lang="pug">
component(
  :is='loaded ? "img" : "svg"',
  :width='width',
  :height='height',
  :src='src',
  :class='{ lazyload: true, isLoading: !loaded && !error, isLoaded: loaded, isError: error }',
  role='img'
)
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  width?: number
  height?: number
}>()

const loaded = ref(false)
const error = ref(false)

function init() {
  const img = new Image()
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

watch(props, init)

onMounted(init)
</script>

<style scoped lang="sass">

.isLoading
  animation: imgProgress 0.6s ease infinite alternate
</style>
