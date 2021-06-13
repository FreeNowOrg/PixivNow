<template lang="pug">
.card
  h2 {{ title }}
  .inner
    slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: {
      type: String,
    },
  },
  data() {
    return {}
  },
  // setup() {},
})
</script>

<style scoped lang="sass">
h2
  text-align: center

.inner
  box-shadow: 0 0 4px #888
  border-radius: 4px
  padding: 1rem
</style>
