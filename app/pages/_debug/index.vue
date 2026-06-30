<template lang="pug">
#debug-index.body-inner
  h1 调试工具
  p.hint 内部调试与预览页面集合，不在导航中公开入口。
  ul.debug-list
    li
      RouterLink.debug-list__link(to='/_debug/components') 组件展示
      span.debug-list__desc 常用 Fnb 组件总览（跟随当前主题）
</template>

<script lang="ts" setup>
definePageMeta({ name: 'debug-index' })
import { setTitle } from '~/utils/setTitle'

onMounted(() => setTitle('Debug'))
</script>

<style scoped lang="scss">
.hint {
  color: var(--fnb-text-muted);
}

.debug-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  li {
    display: flex;
    flex-direction: column;
  }

  &__link {
    font-weight: 700;
    font-size: 1.1rem;
  }

  &__desc {
    color: var(--fnb-text-muted);
    font-size: 0.85rem;
  }
}
</style>
