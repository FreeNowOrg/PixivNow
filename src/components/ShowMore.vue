<template lang="pug">
.showMoreBtn
  a(@click="method")
    | {{ text }}
    | 
    fa(
      v-if="!loading"
      icon="plus")
    fa(
      v-if="loading"
      spin
      icon="spinner")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'show-more',
  props: ['method', 'text', 'loading'],
})
</script>

<style scoped lang="sass">
.showMoreBtn
  text-align: center

  a
    display: inline-block
    margin: 1rem auto
    background-color: var(--theme-tag-color)
    padding: 0.4rem 8rem
    border-radius: 4px
    cursor: pointer
</style>
