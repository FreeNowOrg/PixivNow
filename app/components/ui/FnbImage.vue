<template lang="pug">
.fnb-image(@click='previewSrc ? (showPreview = true) : undefined' :class='{ "fnb-image--preview": previewSrc }')
  img.fnb-image__img(:src='src' :alt='alt' loading='lazy' @error='handleError')
Teleport(to='body')
  Transition(name='dialog')
    .fnb-image__overlay(v-if='showPreview' @click='showPreview = false')
      img(:src='previewSrc || src' :alt='alt')
</template>

<script lang="ts" setup>
const props = defineProps<{
  src: string
  alt?: string
  previewSrc?: string
  fallback?: string
}>()

const showPreview = ref(false)

function handleError(e: Event) {
  if (props.fallback) {
    ;(e.target as HTMLImageElement).src = props.fallback
  }
}
</script>

<style scoped lang="scss">
.fnb-image {
  display: inline-block;

  &--preview {
    cursor: zoom-in;
  }
}

.fnb-image__img {
  max-width: 100%;
  display: block;
}

.fnb-image__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9500;
  cursor: zoom-out;

  img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }
}
</style>
