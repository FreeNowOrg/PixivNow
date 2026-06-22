<template lang="pug">
ul.novel-list
  template(v-if='loading')
    li(v-for='i in skeletonNumber' :key='`skeleton-${i}`')
      NovelCard(loading)
  template(v-else)
    li(v-for='item in list' :key='item.id')
      NovelCard(:item='item')
</template>

<script lang="ts" setup>
import NovelCard from './NovelCard.vue'
import type { NovelInfo } from '~/types'

const props = defineProps<{
  list: NovelInfo[]
  loading?: boolean | number
}>()

const skeletonNumber = computed(() =>
  typeof props.loading === 'number' ? props.loading : 6
)
</script>

<style scoped lang="scss">
.novel-list {
  list-style: none;
  padding-left: 0;
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;

  li {
    min-width: 0;
  }
}
</style>
