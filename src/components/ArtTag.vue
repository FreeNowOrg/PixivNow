<template lang="pug">
NTag.artwork-tag(
  @click='$router.push({ name: "search", params: { keyword: tag, p: 1 } })'
  type='info'
) {{ '#' }}{{ tag }}
</template>

<script lang="ts" setup>
import { NTag } from 'naive-ui'

defineProps<{ tag: string }>()
</script>

<style lang="sass">
.artwork-tag
  margin: 2px
  cursor: pointer
</style>
