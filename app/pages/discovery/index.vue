<template lang="pug">
div
</template>

<script lang="ts" setup>
definePageMeta({
  name: 'discovery-index',
  middleware: () => navigateTo('/discovery/artworks', { replace: true }),
})
</script>
