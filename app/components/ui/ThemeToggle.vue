<template lang="pug">
.theme-toggle(role='group' aria-label='主题切换')
  button.theme-toggle__seg(
    v-for='opt in options'
    :key='opt.value'
    type='button'
    :class='{ "theme-toggle__seg--active": mode === opt.value }'
    :aria-label='opt.label'
    :title='opt.label'
    :aria-pressed='mode === opt.value'
    @click='setTheme(opt.value)'
  )
    component(:is='opt.icon' :size='18' stroke-width='2.5')
</template>

<script lang="ts" setup>
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-vue'
import type { ThemeMode } from '~/composables/useTheme'

const { mode, setTheme } = useTheme()

const options: { value: ThemeMode; label: string; icon: unknown }[] = [
  { value: 'light', label: '亮色', icon: IconSun },
  { value: 'dark', label: '暗色', icon: IconMoon },
  { value: 'auto', label: '跟随系统', icon: IconDeviceDesktop },
]
</script>

<style scoped lang="scss">
.theme-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  @include fnb-border-sm;
  background: var(--fnb-surface);
}

.theme-toggle__seg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.6rem;
  padding: 0;
  background: transparent;
  border: 2px solid transparent;
  color: var(--fnb-text-muted);
  cursor: pointer;
  transition: color 150ms, background 150ms;

  &:hover:not(.theme-toggle__seg--active) {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &--active {
    color: var(--fnb-on-brand);
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}
</style>
