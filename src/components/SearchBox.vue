<template lang="pug">
.searchBox
  input(v-model="keyword", type="text", placeholder="搜索插画")
  button(@click="gotoArt") 搜索
</template>

<script lang="ts">
import { router } from '../router'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      keyword: '',
    }
  },
  methods: {
    gotoArt() {
      if (!this.keyword) {
        return alert('作品 ID 是正整数~')
      }
      router.push(`/search/${encodeURIComponent(this.keyword)}`)
    },
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
    border: 1px solid #888
    border-radius: 4px
    outline: none
    padding: 0.12rem 0.2rem
    color: #444
    height: 2rem
    background-color: rgb(239, 239, 239)
    width: 10rem
    transition: width 0.12s ease-in-out

    &:focus
      background-color: rgb(255, 255, 255)
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
</style>
