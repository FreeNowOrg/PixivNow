<template lang="pug">
component.fnb-button(
  :is='tag || (href ? "a" : "button")'
  :class='[`fnb-button--${variant}`, `fnb-button--${size}`, { "fnb-button--disabled": disabled || loading, "fnb-button--loading": loading }]'
  :disabled='(tag === "button" || !tag) ? (disabled || loading) : undefined'
  :href='href'
  v-bind='$attrs'
)
  span.fnb-button__spinner(v-if='loading')
    svg.spin(viewBox='0 0 24 24' width='1em' height='1em')
      circle(cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='3' stroke-dasharray='31.4 31.4' stroke-linecap='round')
  slot(name='icon' v-if='!loading')
  slot
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'success' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    tag?: string
    href?: string
  }>(),
  {
    variant: 'default',
    size: 'md',
  }
)
</script>

<style scoped lang="scss">
.fnb-button {
  @include fnb-btn;

  &--primary {
    background: var(--fnb-brand);
    color: #fff;
  }

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-on-light);
  }

  &--danger {
    background: var(--fnb-danger);
    color: #fff;
  }

  &--sm {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 700;
    border-width: 2px;
    box-shadow: var(--fnb-shadow-sm);
  }

  &--lg {
    padding: 1rem 2rem;
    font-size: 1.1rem;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;

    &:hover,
    &:active {
      transform: none;
      box-shadow: var(--fnb-shadow);
    }
  }

  &--loading {
    cursor: wait;
  }

  &__spinner {
    display: inline-flex;
    animation: spin 1s linear infinite;
  }

  // Icon slot: slightly larger than text for visual balance (≈ 18/14)
  :deep(.fnb-icon) {
    font-size: 1.25em;
  }
}
</style>
