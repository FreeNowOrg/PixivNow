<template lang="pug">
FnbTag.artwork-tag(
  @click='$router.push(searchUrl)'
  clickable
) {{ tag }}
</template>

<script lang="ts" setup>
const props = defineProps<{
  tag: string
  searchQuery?: Record<string, string>
}>()

const searchUrl = computed(() => {
  const params = new URLSearchParams({ q: props.tag, ...(props.searchQuery ?? {}) })
  return `/search?${params.toString()}`
})
</script>

<style scoped lang="scss">
.artwork-tag {
  margin: 2px;
}
</style>
