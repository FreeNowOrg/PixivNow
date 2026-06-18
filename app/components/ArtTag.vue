<template lang="pug">
FnbTag.artwork-tag(
  @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)'
  clickable
) {{ '#' }}{{ tag }}
</template>

<script lang="ts" setup>
defineProps<{ tag: string }>()
</script>

<style scoped lang="scss">
.artwork-tag {
  margin: 2px;
}
</style>
