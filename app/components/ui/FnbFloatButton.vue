<template lang="pug">
.fnb-float-button(:style='positionStyle')
  button.fnb-float-button__main(@click='$emit("click", $event)' v-bind='$attrs')
    slot
  .fnb-float-button__menu(v-if='$slots.menu')
    slot(name='menu')
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

defineEmits<{
  click: [event: Event]
}>()

const props = defineProps<{
  bottom?: number
  right?: number
}>()

const positionStyle = computed(() => ({
  bottom: props.bottom ? `${props.bottom}px` : undefined,
  right: props.right ? `${props.right}px` : undefined,
}))
</script>

<style scoped lang="scss">
.fnb-float-button {
  position: fixed;
  z-index: 100;

  &:hover .fnb-float-button__menu {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}

.fnb-float-button__main {
  @include fnb-border;
  @include fnb-shadow-sm;
  @include fnb-press;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fnb-surface);
  cursor: pointer;
  font-size: 1.25rem;
  border-radius: var(--fnb-radius);
}

.fnb-float-button__menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(4px);
  transition: all 200ms ease-out;
}
</style>
