<template lang="pug">
RouterLink.tag(:to='"/search/" + tag') \#{{ tag }}
</template>

<script lang="ts" setup>
defineProps<{ tag: string }>()
</script>

<style lang="sass">

.tag
  display: inline-block
  margin: 2px
  padding: 2px 4px
  background-color: var(--theme-tag-color)
  border-radius: 4px
</style>
