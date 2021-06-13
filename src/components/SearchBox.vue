<template lang="pug">
.searchBox
  input(v-model="keyword" @keyup.enter="makeSearch", placeholder="搜索插画")
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
        return alert('作品 ID 是正整数~')
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

<style scoped lang="sass">
.searchBox
  display: flex
  align-items: center
  // margin: 0 auto;

  input
    // width: 100%;
    box-sizing: border-box
    font-size: 0.8rem
    border: 1px solid var(--theme-border-color)
    border-radius: 4px
    outline: none
    padding: 0.2rem 0.6em
    color: #444
    height: 2rem
    background-color: rgb(245, 245, 245)
    width: 10rem
    transition: all 0.12s ease-in-out

    &:focus
      background-color: var(--theme-background-color)
      width: 20rem

  button
    padding: 0.2rem 0.4rem
    font-size: 1rem
    border: none
    border-radius: 4px
    background-color: rgb(21, 109, 180)
    color: #fff
    display: block
    margin-left: 1rem

  &.big
    input
      width: 100%
      height: 3rem
      font-size: 1.4rem
</style>
