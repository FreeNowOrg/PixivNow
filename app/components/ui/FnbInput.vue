<template lang="pug">
input.fnb-input(
  :class='{ "fnb-input--disabled": disabled }'
  :disabled='disabled'
  :placeholder='placeholder'
  :readonly='readonly'
  :type='type'
  :value='modelValue'
  @input='$emit("update:modelValue", ($event.target as HTMLInputElement).value)'
)
</template>

<script lang="ts" setup>
defineEmits<{
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
