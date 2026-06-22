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
  const base = `/search/${encodeURIComponent(props.tag)}/1`
  if (!props.searchQuery || !Object.keys(props.searchQuery).length) return base
  const qs = new URLSearchParams(props.searchQuery).toString()
  return `${base}?${qs}`
})
</script>

<style scoped lang="scss">
.artwork-tag {
  margin: 2px;
}
</style>
