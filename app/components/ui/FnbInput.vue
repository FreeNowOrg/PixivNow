<template lang="pug">
input.fnb-input(
  :class='{ "fnb-input--disabled": disabled }'
  :disabled='disabled'
  :placeholder='placeholder'
  :readonly='readonly'
  :type='type'
  :value='modelValue'
  @input='onInput'
)
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    type?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    type: 'text',
  }
)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<style scoped lang="scss">
.fnb-input {
  @include fnb-input;
  width: 100%;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
