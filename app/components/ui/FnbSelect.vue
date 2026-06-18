<template lang="pug">
.fnb-select
  select.fnb-select__native(
    :disabled='disabled'
    :value='modelValue'
    @change='$emit("update:modelValue", ($event.target as HTMLSelectElement).value)'
  )
    option(v-if='placeholder' value='' disabled selected hidden) {{ placeholder }}
    option(
      v-for='opt in options'
      :key='opt.value'
      :value='opt.value'
    ) {{ opt.label }}
</template>

<script lang="ts" setup>
defineEmits<{
  'update:modelValue': [value: string]
}>()

defineProps<{
  modelValue?: string
  options: { label: string; value: string }[]
  placeholder?: string
  disabled?: boolean
}>()
</script>

<style scoped lang="scss">
.fnb-select__native {
  @include fnb-input;
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%23000'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem;
  cursor: pointer;
}
</style>
