<template lang="pug">
.fnb-ellipsis(:style='ellipsisStyle')
  slot
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    lineClamp?: number
  }>(),
  {
    lineClamp: 1,
  }
)

const ellipsisStyle = computed(() => ({
  display: '-webkit-box',
  '-webkit-line-clamp': props.lineClamp,
  '-webkit-box-orient': 'vertical',
  overflow: 'hidden',
}))
</script>
