<template lang="pug">
NuxtImg(
  :height='height ?? 100',
  :src='src',
  :width='width ?? 100'
  loading='lazy'
  placeholder='/images/spinner.svg'
)
</template>

<script lang="ts" setup>
defineProps<{
  src: string
  width?: number
  height?: number
}>()
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
</style>
