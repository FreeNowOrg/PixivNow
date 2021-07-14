<template lang="pug">
card
  .authorCard
    .flex-center
      .left
        router-link(:to="'/users/' + user.userId")
          img(:src="API + user.imageBig" alt="")
      .right
        h4: strong
          router-link(:to="'/users/' + user.userId") {{ user.name }}
        p.description.pre {{ user.comment }}

    ArtworksMiniList.inline.tiny(:list="user.illusts")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ArtworksMiniList from '../components/ArtworksList/ArtworksMiniList.vue'
import Card from './Card.vue'

export default defineComponent({
  components: { ArtworksMiniList, Card },
  props: ['user'],
  data() {
    return {
      API: 'https://pixiv.js.org',
    }
  },
})
</script>

<style scoped lang="sass">
.left
  margin-right: 1rem

  img
    border-radius: 50%
    width: 80px
    height: 80px

.right
  flex: 1

.description
  width: 100%
  max-height: 120px
  overflow: auto
</style>
