<template lang="pug">
svg.layload.isLoading(v-if="!loaded && !error" :width="width" :height="height" role="img" :class="class")
svg.layload.isError(v-if="error" :width="width" :height="height" role="img" :class="class")
img.lazyload.isLoaded(v-if="loaded" :width="width" :height="height" :src="src" role="img" :class="class")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['src', 'width', 'height', 'class'],
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
