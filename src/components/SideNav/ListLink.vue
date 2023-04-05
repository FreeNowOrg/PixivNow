<template lang="pug">
mixin content
  slot
    i-fa-solid-list-ul
  | {{ text }}

li
  router-link.plain(:to='link' v-if='link')
    +content
  a.plain(:href='externalLink' target='_blank' v-else-if='externalLink')
    +content
  a.plain.not-allowed(v-else)
    +content
</template>

<script lang="ts" setup>
defineProps<{
  text: string
  externalLink?: string
  link?: string
}>()
</script>

<style scoped lang="sass">
li
  a
    padding: 0.8rem 1.6rem
    display: block
    color: #888

    &:hover
      background-color: rgba(0, 0, 0, 0.05)

    &.not-allowed
      cursor: not-allowed
      text-decoration: line-through

    [data-icon]
      width: 2rem
</style>
