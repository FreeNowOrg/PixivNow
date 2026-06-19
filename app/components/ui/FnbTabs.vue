<template lang="pug">
.fnb-tabs
  .fnb-tabs__nav
    button.fnb-tabs__tab(
      v-for='tab in tabs'
      :key='tab.key'
      :class='{ "fnb-tabs__tab--active": modelValue === tab.key }'
      @click='$emit("update:modelValue", tab.key)'
    ) {{ tab.label }}
  .fnb-tabs__panel(v-for='tab in tabs' :key='tab.key' v-show='modelValue === tab.key')
    slot(:name='`panel-${tab.key}`')
</template>

<script lang="ts" setup>
defineEmits<{
  'update:modelValue': [value: string]
}>()

defineProps<{
  modelValue?: string
  tabs: { key: string; label: string }[]
}>()
</script>

<style scoped lang="scss">
.fnb-tabs__nav {
  display: flex;
  @include fnb-border;
  padding: 4px;
  gap: 4px;
  background: color-mix(in srgb, var(--fnb-brand) 10%, var(--fnb-surface));
}

.fnb-tabs__tab {
  flex: 1;
  padding: 0.6rem 1rem;
  background: transparent;
  border: 3px solid transparent;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 150ms, background 150ms;
  color: var(--fnb-text-muted);

  &:hover:not(.fnb-tabs__tab--active) {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &--active {
    color: #fff;
    font-weight: 900;
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}

.fnb-tabs__panel {
  margin-top: 1rem;
}
</style>
