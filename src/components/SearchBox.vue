<template lang="pug">
.search-box
  input(
    @keyup.enter='makeSearch'
    placeholder='输入关键词搜索/输入 id:数字 查看作品'
    v-model='keyword'
  )
  IFasSearch.icon(data-icon)
</template>

<script lang="ts" setup>
import IFasSearch from '~icons/fa-solid/search'
const route = useRoute()
const router = useRouter()
const keyword = ref((route.params.keyword as string) || '')

function makeSearch(): void {
  if (!keyword.value) {
    return
  }
  if (/^id:(\d+)$/.test(keyword.value)) {
    router.push(`/artworks/${/^id:(\d+)$/.exec(keyword.value)?.[1]}`)
    return
  }
  router.push(`/search/${encodeURIComponent(keyword.value)}/1`)
}
</script>

<style lang="sass">

// Search Box
.search-box
  display: flex
  position: relative
  align-items: center
  font-size: 0.8rem

  .icon, [data-icon]
    position: absolute
    left: 0.6em
    pointer-events: none
    color: var(--theme-border-color)
    transition: all 0.24s ease-in-out

  input
    color: var(--theme-border-color)
    font-size: inherit
    box-sizing: border-box
    border: none
    // border: 2px solid #fff
    border-radius: 2em
    outline: none
    padding: 0.2rem 0.6em
    padding-left: 2em
    height: 2rem
    background-color: rgba(255, 255, 255, 0.7)
    width: 100%
    transition: all 0.12s ease-in-out

    &:focus
      color: var(--theme-text-color)
      background-color: rgba(255, 255, 255, 0.94)
      // width: calc(25vw + 10em)

    &:focus + .icon, &:focus + [data-icon]
      color: var(--theme-text-color)

  &.big
    font-size: 1.4rem

    input
      width: 100%
      height: 3rem
      border-width: 4px

.global-navbar .search-box input
  background-color: none
</style>
