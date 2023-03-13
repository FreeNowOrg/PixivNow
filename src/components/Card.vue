<template lang="pug">
.card
  h2(:id='title' v-if='title') {{ title }}
  .inner
    slot/
</template>

<script lang="ts" setup>
defineProps<{ title: string | undefined }>()
</script>

<style scoped lang="sass">

h2
  text-align: center

.inner
  box-shadow: var(--theme-box-shadow)
  background-color: var(--theme-background-color)
  border-radius: 4px
  padding: 1rem
  transition: box-shadow .24s ease-in-out

  &:hover
    box-shadow: var(--theme-box-shadow-hover)
</style>
