<template lang="pug">
.show-more
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

<script lang="ts" setup>
const props = defineProps<{
  text: string
  method: () => void
  loading: boolean
}>()
</script>

<style scoped lang="sass">

.show-more
  text-align: center

  a
    display: inline-block
    margin: 1rem auto
    background-color: var(--theme-tag-color)
    padding: 0.4rem 8rem
    border-radius: 4px
    cursor: pointer
</style>
