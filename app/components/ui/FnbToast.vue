<template lang="pug">
Teleport(to='body')
  TransitionGroup.fnb-toast-container(name='toast' tag='div')
    .fnb-toast(
      v-for='toast in toasts'
      :key='toast.id'
      :class='`fnb-toast--${toast.type}`'
    ) {{ toast.message }}
</template>

<script lang="ts" setup>
import { useToastState } from '~/composables/useToast'

const { toasts } = useToastState()
</script>

<style scoped lang="scss">
.fnb-toast-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}

.fnb-toast {
  @include fnb-border-sm;
  @include fnb-shadow-sm;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  pointer-events: auto;
  max-width: 80vw;

  &--info {
    background: var(--fnb-surface);
  }

  &--success {
    background: var(--fnb-success);
  }

  &--warning {
    background: var(--fnb-highlight);
  }

  &--error {
    background: var(--fnb-danger);
    color: #fff;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: transform 250ms ease-out, opacity 250ms ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
