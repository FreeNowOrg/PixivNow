<template lang="pug">
table.fnb-table
  slot
</template>

<style scoped lang="scss">
.fnb-table {
  width: 100%;
  border-collapse: collapse;

  :deep(th),
  :deep(td) {
    @include fnb-border-sm;
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  :deep(th) {
    background: var(--fnb-bg);
    font-weight: 700;
  }

  :deep(tr:hover td) {
    background: var(--fnb-bg);
  }
}
</style>
