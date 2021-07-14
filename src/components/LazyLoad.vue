<template lang="pug">
svg.layload.isLoading(v-if="!loaded" :width="width" :height="height" rol="img")
svg.layload.isError(v-if="error" :width="width" :height="height" rol="img")
img.lazyload.isLoaded(v-if="loaded" :width="width" :height="height" :src="src" rol="img")
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
  mounted() {
    const img = new Image()
    img.src = this.src
    img.onload = () => {
      this.loaded = true
    }
    img.onerror = () => {
      this.error = true
    }
  },
  watch: {
    error() {
      if (this.error) this.loaded = false
    },
  },
})
</script>

<style scoped lang="sass">
.isLoading
  animation: imgProgress 0.6s ease infinite alternate
</style>
