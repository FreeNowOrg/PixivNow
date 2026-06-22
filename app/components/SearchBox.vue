<template lang="pug">
.search-box(:class='{ "no-icon": noIcon }')
  input(
    @keyup.enter='makeSearch'
    placeholder='输入关键词搜索/输入 id:数字 查看作品'
    v-model='keyword'
  )
  IFasSearch.icon(data-icon, v-if='!noIcon')
</template>

<script lang="ts" setup>
import IFasSearch from '~icons/fa-solid/search'

const props = defineProps<{
  type?: string
  noIcon?: boolean
}>()

const route = useRoute()
const router = useRouter()
const keyword = ref((route.query.q as string) || '')

function makeSearch(): void {
  if (!keyword.value) {
    return
  }
  if (/^id:(\d+)$/.test(keyword.value)) {
    router.push(`/artworks/${/^id:(\d+)$/.exec(keyword.value)?.[1]}`)
    return
  }
  const query: Record<string, string> = { q: keyword.value }
  if (props.type && props.type !== 'artworks') {
    query.type = props.type
  }
  router.push({ path: '/search', query })
}
</script>

<style lang="scss">

// Search Box
.search-box {
  display: flex;
  position: relative;
  align-items: center;
  font-size: 0.8rem;

  &.no-icon input {
    padding-left: 0.6em;
  }

  .icon,
  [data-icon] {
    position: absolute;
    left: 0.6em;
    pointer-events: none;
    color: var(--fnb-text-muted);
    transition: all 0.24s ease-in-out;
  }

  input {
    @include fnb-input;
    font-size: inherit;
    box-sizing: border-box;
    border-radius: var(--fnb-radius-sm);
    padding: 0.2rem 0.6em;
    padding-left: 2em;
    height: 2rem;
    width: 100%;
    transition: all 0.12s ease-in-out;

    &:focus {
      color: var(--fnb-text);
    }

    &:focus + .icon,
    &:focus + [data-icon] {
      color: var(--fnb-text);
    }
  }

  &.big {
    font-size: 1.4rem;

    input {
      width: 100%;
      height: 3rem;
    }
  }
}
</style>
