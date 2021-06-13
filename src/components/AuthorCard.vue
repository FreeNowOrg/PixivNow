<template lang="pug">
card
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
import Card from './Card.vue'

export default defineComponent({
  components: { Card },
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
  display: flex
  align-items: center

.left
  margin-right: 1rem

  img
    border-radius: 50%
    width: 80px
    height: 80px
</style>
