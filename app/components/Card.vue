<template lang="pug">
.card
  h2(:id='title' v-if='title') {{ title }}
  .inner
    slot
</template>

<script lang="ts" setup>
defineProps<{ title: string | undefined }>()
</script>

<style scoped lang="scss">
.inner {
  @include fnb-card;
  padding: 1rem;
}
</style>
