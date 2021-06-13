<template lang="pug">
.authorCard
  .left
    router-link(:to="'/users/' + user.userId")
      img(:src="API + user.imageBig" alt="")
  .right
    h4: strong
      router-link(:to="'/users/' + user.userId") {{ user.name }}
    p.description {{ user.comment }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['user'],
  data() {
    return {
      API: 'https://pixiv.js.org',
    }
  },
})
</script>

<style scoped lang="sass">
.authorCard
  box-shadow: 0 0 4px var(--theme-box-shadow-color)
  border-radius: 4px
  padding: 1rem
  display: flex
  align-items: center

.left
  margin-right: 1rem

  img
    border-radius: 50%
    width: 80px
    height: 80px
</style>
