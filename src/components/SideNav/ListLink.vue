<template lang="pug">
mixin content
  slot
    IFasListUl.svg--ListLink
  | {{ text }}

li
  RouterLink.plain(:to='link' v-if='link')
    +content
  a.plain(:href='externalLink' target='_blank' v-else-if='externalLink')
    +content
  a.plain.not-allowed(v-else)
    +content
</template>

<script lang="ts" setup>
import IFasListUl from '~icons/fa-solid/list-ul'
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

    .svg--ListLink
      width: 2em

:slotted(svg)
  width: 2em
</style>
