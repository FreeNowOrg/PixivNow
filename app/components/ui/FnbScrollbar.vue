<template lang="pug">
.fnb-scrollbar(:class='{ "fnb-scrollbar--x": xScrollable }')
  slot
</template>

<script lang="ts" setup>
defineProps<{
  xScrollable?: boolean
}>()
</script>

<style scoped lang="scss">
.fnb-scrollbar {
  overflow: auto;

  &--x {
    overflow-x: auto;
    overflow-y: hidden;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--fnb-text-muted);
    border-radius: var(--fnb-radius-sm);

    &:hover {
      background: var(--fnb-text);
    }
  }
}
</style>
