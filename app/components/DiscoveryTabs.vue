<template lang="pug">
.discovery-tabs
  button.discovery-tab(
    v-for='tab in tabs',
    :key='tab.value',
    :class='{ active: modelValue === tab.value, disabled: tab.disabled }',
    :disabled='tab.disabled',
    @click='!tab.disabled && $emit("update:modelValue", tab.value)'
  )
    | {{ tab.label }}
    span.coming-soon(v-if='tab.disabled') soon
</template>

<script lang="ts" setup>
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()

const tabs = [
  { label: '插画·漫画', value: 'all', disabled: false },
  { label: '小说', value: 'novel', disabled: false },
]
</script>

<style scoped lang="scss">
.discovery-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.discovery-tab {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.3rem 0.75rem;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  transition: all 150ms;

  &.active {
    background: var(--fnb-brand);
    color: var(--fnb-on-brand);
    box-shadow: none;
    transform: translate(3px, 3px);
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(.active):not(.disabled) {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
  }

  .coming-soon {
    font-size: 0.6rem;
    margin-left: 0.25rem;
    vertical-align: super;
    opacity: 0.7;
  }
}
</style>
