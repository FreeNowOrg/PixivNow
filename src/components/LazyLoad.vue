<template lang="pug">
component(
  :is='loaded ? "img" : "svg"',
  :width='width',
  :height='height',
  :src='src',
  :class='{ lazyload: true, isLoading: !loaded && !error, isLoaded: loaded, isError: error }',
  role='img'
)
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['src', 'width', 'height'],
  data() {
    return {
      loaded: false,
      error: false,
    }
  },
  methods: {
    init() {
      this.loaded = false
      this.error = false
      const img = new Image()
      img.src = this.src
      img.onload = () => {
        this.loaded = true
      }
      img.onerror = () => {
        this.error = true
      }
    },
  },
  watch: {
    src() {
      this.init
    },
  },
  mounted() {
    this.init()
  },
})
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
</style>
