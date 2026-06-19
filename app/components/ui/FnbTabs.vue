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
  border-bottom: 3px solid var(--fnb-border);
  gap: 0;
}

.fnb-tabs__tab {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--fnb-surface);
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -3px;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms;
  color: var(--fnb-text-muted);

  &:hover {
    background: var(--fnb-bg);
  }

  &--active {
    color: var(--fnb-text);
    border-bottom-color: var(--fnb-brand);
    background: var(--fnb-surface);
  }
}
</style>
