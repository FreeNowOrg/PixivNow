<template lang="pug">
template(v-if='repeat > 1')
  span.fnb-skeleton(
    v-for='i in repeat'
    :key='i'
    :class='classes'
    :style='sizeStyle'
  )
span.fnb-skeleton(v-else :class='classes' :style='sizeStyle')
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    circle?: boolean
    block?: boolean
    text?: boolean
    repeat?: number
  }>(),
  {
    repeat: 1,
  }
)

const classes = computed(() => ({
  'fnb-skeleton--circle': props.circle,
  'fnb-skeleton--block': props.block,
  'fnb-skeleton--text': props.text,
}))

const sizeStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))
</script>

<style scoped lang="scss">
.fnb-skeleton {
  display: inline-block;
  background: var(--fnb-skeleton);
  animation: imgProgress 0.8s ease infinite alternate;
  border-radius: var(--fnb-radius-sm);

  &--circle {
    border-radius: 50%;
  }

  &--block {
    display: block;
    width: 100%;
  }

  &--text {
    height: 1em;
    display: inline-block;
  }
}
</style>
