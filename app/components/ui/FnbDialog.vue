<template lang="pug">
Teleport(to='body')
  Transition(name='dialog')
    .fnb-dialog-overlay(v-if='dialogState' @click.self='cancel')
      .fnb-dialog
        button.fnb-dialog__close(@click='cancel' aria-label='关闭') ×
        .fnb-dialog__header {{ dialogState.title }}
        .fnb-dialog__body {{ dialogState.content }}
        .fnb-dialog__footer
          FnbButton(v-if='dialogState.negativeText' @click='cancel') {{ dialogState.negativeText }}
          FnbButton(variant='primary' @click='confirm') {{ dialogState.positiveText || '确定' }}
</template>

<script lang="ts" setup>
import { useDialogState } from '~/composables/useDialog'
import { useBodyScrollLock } from '~/composables/useBodyScrollLock'

const { dialogState, confirm, cancel } = useDialogState()

const isOpen = computed(() => !!dialogState.value)
useBodyScrollLock(isOpen)
</script>

<style scoped lang="scss">
.fnb-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.fnb-dialog {
  @include fnb-border;
  @include fnb-shadow-lg;
  background: var(--fnb-surface);
  padding: 1.5rem;
  width: 400px;
  max-width: 86vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.fnb-dialog__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  color: var(--fnb-text-muted);
  padding: 0.25rem;

  &:hover {
    color: var(--fnb-text);
  }
}

.fnb-dialog__header {
  font-family: var(--fnb-font-display);
  font-weight: 900;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  padding-right: 2rem;
}

.fnb-dialog__body {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.fnb-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 200ms ease-out;

  .fnb-dialog {
    transition: transform 200ms ease-out, opacity 200ms ease-out;
  }
}

.dialog-enter-from {
  opacity: 0;

  .fnb-dialog {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
}

.dialog-leave-to {
  opacity: 0;

  .fnb-dialog {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
