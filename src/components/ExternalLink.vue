<template lang="pug">
a(:href='href' rel='nofollow' target='_blank')
  slot
  i-fa-solid-external-link-alt.external-icon
</template>

<script lang="ts" setup>
defineProps<{ href: string }>()
</script>

<style scoped lang="sass">

.external-icon
  margin-left: 0.4em
  font-size: 0.7em
  vertical-align: 0
</style>
