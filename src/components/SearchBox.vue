<template lang="pug">
.searchBox
  input(v-model="keyword" @keyup.enter="makeSearch", placeholder="搜索插画")
  fa.icon(icon="search")
</template>

<script lang="ts">
import { router } from '../router'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      keyword: (this.$route.params.keyword as string) || '',
    }
  },
  methods: {
    makeSearch() {
      if (!this.keyword) {
        return
      }
      router.push(`/search/${encodeURIComponent(this.keyword)}/1`)
    },
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () =>
        this.$route.params.keyword
          ? (this.keyword = this.$route.params.keyword as string)
          : null
    )
  },
})
</script>

<style lang="sass">
// Search Box
.searchBox
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
    border: 2px solid #fff
    border-radius: 1em
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

.globalNavbar .searchBox input
  background-color: none
</style>
