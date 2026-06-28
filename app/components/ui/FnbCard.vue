<template lang="pug">
.fnb-card(:class='[`fnb-card--${color}`, `fnb-card--shadow-${shadow}`]')
  slot
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    color?: 'white' | 'brand' | 'highlight' | 'success'
    shadow?: 'sm' | 'md' | 'lg' | 'none'
  }>(),
  {
    color: 'white',
    shadow: 'md',
  }
)
</script>

<style scoped lang="scss">
.fnb-card {
  @include fnb-border;
  background: var(--fnb-surface);
  padding: 1rem;
  transition: all 150ms;

  &--shadow-sm {
    @include fnb-shadow-sm;
  }

  &--shadow-md {
    @include fnb-shadow;
  }

  &--shadow-lg {
    @include fnb-shadow-lg;
  }

  &--shadow-none {
    box-shadow: none;
  }

  &--brand {
    background: var(--fnb-brand);
    color: #fff;
  }

  &--highlight {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
  }

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-on-light);
  }
}
</style>
