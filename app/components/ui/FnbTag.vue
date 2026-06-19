<template lang="pug">
span.fnb-tag(
  :class='{ "fnb-tag--active": active, "fnb-tag--clickable": clickable }'
  :style='colorStyle'
  :role='clickable ? "button" : undefined'
  :tabindex='clickable ? 0 : undefined'
  @click='clickable ? $emit("click", $event) : undefined'
  @keydown.enter='clickable ? $emit("click", $event) : undefined'
)
  slot
</template>

<script lang="ts" setup>
defineEmits<{
  click: [event: Event]
}>()

const props = withDefaults(
  defineProps<{
    color?: string
    active?: boolean
    clickable?: boolean
  }>(),
  {
    clickable: false,
  }
)

const colorStyle = computed(() => {
  if (!props.color) return undefined
  return { 'background-color': props.color }
})
</script>

<style scoped lang="scss">
.fnb-tag {
  @include fnb-tag;

  &--active {
    background: var(--fnb-highlight);
    font-weight: 700;
  }

  &--clickable {
    cursor: pointer;

    @include fnb-press;
  }
}
</style>
