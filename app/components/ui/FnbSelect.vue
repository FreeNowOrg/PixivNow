<template lang="pug">
.fnb-select(:class='{ open }', ref='selectRef')
  button.fnb-select-trigger(@click='open = !open', type='button')
    span.fnb-select-label {{ currentLabel }}
    span.fnb-select-arrow(:class='{ flipped: open }') ▼
  Transition(name='fnb-select-dropdown')
    .fnb-select-dropdown(v-if='open')
      .fnb-select-option(
        v-for='opt in options',
        :key='opt.value',
        :class='{ selected: opt.value === modelValue }',
        @click='select(opt.value)'
      ) {{ opt.label }}
</template>

<script lang="ts" setup>
const props = defineProps<{
  options: { label: string; value: string }[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const selectRef = ref<HTMLElement>()

const currentLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt?.label ?? props.modelValue
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

onClickOutside(selectRef, () => {
  open.value = false
})
</script>

<style scoped lang="scss">
.fnb-select {
  position: relative;
  display: inline-block;
  min-width: 6rem;
}

.fnb-select-trigger {
  width: 100%;
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  padding: 0.3rem 0.75rem;
  background: var(--fnb-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4em;
  font-weight: 700;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--fnb-text);
  transition: all 150ms;

  &:hover {
    transform: translate(1.5px, 1.5px);
    box-shadow: none;
  }
}

.fnb-select-arrow {
  font-size: 0.6rem;
  transition: transform 0.2s;
  &.flipped {
    transform: rotate(180deg);
  }
}

.fnb-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  background: var(--fnb-surface);
  z-index: 50;
  overflow: hidden;
}

.fnb-select-option {
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;

  &:hover {
    background: var(--fnb-highlight);
  }

  &.selected {
    background: var(--fnb-brand);
    color: #fff;
    font-weight: 700;
  }
}

.fnb-select-dropdown-enter-active,
.fnb-select-dropdown-leave-active {
  transition: all 0.15s ease;
}
.fnb-select-dropdown-enter-from,
.fnb-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
