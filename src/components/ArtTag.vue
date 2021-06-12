<template lang="pug">
router-link.tag(:to="'/search/' + tag") \#{{ tag }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['tag'],
  setup() {
    return {
      // key: '',
    }
  },
})
</script>

<style lang="sass">
.tag
  display: inline-block
  margin: 2px
  padding: 2px 4px
  background-color: #d6e4ff
  border-radius: 4px
</style>
