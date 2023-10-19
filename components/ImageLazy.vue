<template lang="pug">
NuxtImg(loading='lazy' :src='src' :width='width ?? 100' :height='height ?? 100' placeholder='/images/spinner.svg')
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
