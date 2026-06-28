<template lang="pug">
.fnb-mbox(:class='`fnb-mbox--${type}`')
  .fnb-mbox__header(v-if='header || $slots.header')
    slot(name='header') {{ header }}
  .fnb-mbox__body
    slot
  button.fnb-mbox__close(v-if='closable' @click='$emit("close")' aria-label='关闭') ×
</template>

<script lang="ts" setup>
defineEmits<{
  close: []
}>()

withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'error'
    header?: string
    closable?: boolean
  }>(),
  {
    type: 'info',
  }
)
</script>

<style scoped lang="scss">
.fnb-mbox {
  @include fnb-border;
  @include fnb-shadow-sm;
  padding: 1rem;
  position: relative;

  &--info {
    background: var(--fnb-surface);
  }

  &--success {
    background: var(--fnb-success);
    color: var(--fnb-on-light);
  }

  &--warning {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
  }

  &--error {
    background: var(--fnb-danger);
    color: #fff;
  }
}

.fnb-mbox__header {
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.fnb-mbox__close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  font-weight: 900;
  line-height: 1;
  padding: 0.25rem;
  color: inherit;
}
</style>
