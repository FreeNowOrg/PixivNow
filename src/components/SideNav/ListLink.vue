<template lang="pug">
mixin content()
  fa(:icon="icon")
  | {{ text }}

li
  router-link.plain(v-if="link" :to="link")
    +content()
  a.plain(v-else-if="externalLink" :href="externalLink" target="_blank")
    +content()
  a.plain.not-allowed(v-else)
    +content()

</template>

<script lang="ts" setup>
const props = defineProps<{
  icon: string
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
