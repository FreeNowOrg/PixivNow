<template lang="pug">
nav.fnb-pagination(v-if='totalPages > 1' aria-label='分页导航')
  button.fnb-pagination__btn(
    :disabled='page <= 1'
    @click='goTo(page - 1)'
    aria-label='上一页'
  ) ‹
  template(v-for='p in visiblePages' :key='p')
    span.fnb-pagination__ellipsis(v-if='p === "..."') …
    button.fnb-pagination__btn(
      v-else
      :class='{ "fnb-pagination__btn--active": p === page }'
      @click='goTo(+p)'
    ) {{ p }}
  button.fnb-pagination__btn(
    :disabled='page >= totalPages'
    @click='goTo(page + 1)'
    aria-label='下一页'
  ) ›
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  'update:page': [value: number]
}>()

const props = withDefaults(
  defineProps<{
    page?: number
    itemCount: number
    pageSize: number
    pageSlot?: number
  }>(),
  {
    page: 1,
    pageSlot: 7,
  }
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.itemCount / props.pageSize))
)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.page
  const slot = props.pageSlot

  if (total <= slot) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]
  const half = Math.floor((slot - 2) / 2)
  let start = Math.max(2, current - half)
  let end = Math.min(total - 1, current + half)

  if (current - half < 2) {
    end = Math.min(total - 1, slot - 2)
  }
  if (current + half > total - 1) {
    start = Math.max(2, total - slot + 3)
  }

  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)

  return pages
})

function goTo(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    emit('update:page', p)
  }
}
</script>

<style scoped lang="scss">
.fnb-pagination {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.fnb-pagination__btn {
  @include fnb-border-sm;
  @include fnb-shadow-xs;
  @include fnb-press;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  background: var(--fnb-surface);
  font-weight: 700;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: var(--fnb-radius-sm);

  &--active {
    background: var(--fnb-brand);
    color: var(--fnb-on-brand);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.fnb-pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  color: var(--fnb-text-muted);
}
</style>
