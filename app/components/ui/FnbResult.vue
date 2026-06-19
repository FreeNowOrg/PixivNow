<template lang="pug">
.fnb-result
  .fnb-result__status {{ statusEmoji }}
  .fnb-result__title(v-if='title') {{ title }}
  .fnb-result__description(v-if='description') {{ description }}
  .fnb-result__footer(v-if='$slots.footer')
    slot(name='footer')
  slot
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    status?: 'warning' | '500' | 'error' | 'info' | 'success' | '404' | '403' | '418'
    title?: string
    description?: string
  }>(),
  {
    status: 'warning',
  }
)

const statusEmoji = computed(() => {
  const map: Record<string, string> = {
    warning: '⚠',
    '500': '500',
    error: '✗',
    info: 'ℹ',
    success: '✓',
    '404': '404',
    '403': '403',
    '418': '418',
  }
  return map[props.status] || props.status
})
</script>

<style scoped lang="scss">
.fnb-result {
  text-align: center;
  padding: 2rem;
}

.fnb-result__status {
  font-family: var(--fnb-font-display);
  font-size: 4rem;
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.fnb-result__title {
  font-family: var(--fnb-font-display);
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
}

.fnb-result__description {
  color: var(--fnb-text-muted);
  margin-bottom: 1rem;
}

.fnb-result__footer {
  margin-top: 1rem;
}
</style>
