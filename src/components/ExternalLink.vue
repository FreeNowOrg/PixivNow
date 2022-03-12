<template lang="pug">
a(:href="href" target="_blank" rel="nofollow")
  slot
  fa.externalIcon(icon="external-link-alt")
</template>

<script lang="ts" setup>

const props = defineProps<{ href: string }>()
</script>

<style scoped lang="sass">

.externalIcon
  margin-left: 0.4em
  font-size: 0.7em
  vertical-align: 0
</style>
