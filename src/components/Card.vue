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
.inner
  background-color: var(--theme-background-color)
  border: 1px solid #efefef
  border-radius: 0.5rem
  padding: 1rem
</style>
