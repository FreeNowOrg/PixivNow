<template lang="pug">
Transition(name='back-to-top')
  button.back-to-top(
    v-show='visible',
    @click='scrollToTop',
    aria-label='回到顶部',
    title='回到顶部'
  )
    ITablerArrowUp
</template>

<script lang="ts" setup>
import { IconArrowUp as ITablerArrowUp } from '@tabler/icons-vue'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 400
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped lang="scss">
.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fnb-border;
  @include fnb-shadow;
  background: var(--fnb-surface);
  color: var(--fnb-text);
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 150ms;

  &:hover {
    background: var(--fnb-highlight);
    color: var(--fnb-on-light);
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
