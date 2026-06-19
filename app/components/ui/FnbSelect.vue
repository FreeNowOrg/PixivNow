<template lang="pug">
.fnb-select(:class='{ open }', ref='selectRef')
  button.fnb-select-trigger(
    @click='open = !open',
    @keydown='onTriggerKeydown',
    type='button',
    role='combobox',
    :aria-expanded='open',
    aria-haspopup='listbox',
    :aria-activedescendant='open ? `fnb-opt-${modelValue}` : undefined'
  )
    span.fnb-select-label {{ currentLabel }}
    span.fnb-select-arrow(:class='{ flipped: open }') ▼
  Transition(name='fnb-select-dropdown')
    ul.fnb-select-dropdown(
      v-if='open',
      role='listbox',
      ref='dropdownRef'
    )
      li.fnb-select-option(
        v-for='(opt, i) in options',
        :key='opt.value',
        :id='`fnb-opt-${opt.value}`',
        :class='{ selected: opt.value === modelValue, focused: i === focusedIndex }',
        :aria-selected='opt.value === modelValue',
        role='option',
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
const focusedIndex = ref(-1)
const selectRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()

const currentLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt?.label ?? props.modelValue
})

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  focusedIndex.value = -1
}

function onTriggerKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      e.preventDefault()
      if (!open.value) {
        open.value = true
        focusedIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
        if (focusedIndex.value === -1) focusedIndex.value = 0
      } else {
        moveFocus(e.key === 'ArrowDown' ? 1 : -1)
      }
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      if (open.value && focusedIndex.value >= 0) {
        select(props.options[focusedIndex.value]!.value)
      } else {
        open.value = !open.value
        if (open.value) {
          focusedIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
          if (focusedIndex.value === -1) focusedIndex.value = 0
        }
      }
      break
    case 'Escape':
      e.preventDefault()
      open.value = false
      focusedIndex.value = -1
      break
  }
}

function moveFocus(delta: number) {
  const len = props.options.length
  if (!len) return
  focusedIndex.value = (focusedIndex.value + delta + len) % len
}

onClickOutside(selectRef, () => {
  open.value = false
  focusedIndex.value = -1
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
  list-style: none;
  padding: 0;
  margin: 0;
}

.fnb-select-option {
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;

  &:hover,
  &.focused {
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
