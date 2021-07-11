<template lang="pug">
.comment
  img.avatar(
    :src="comment.img"
    :title="comment.userName+ ' (' + comment.userId + ')'"
  )
  h4 {{ comment.userName }}
  div
    p {{ comment.comment }}
    .commentDate {{ comment.commentDate }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import stampList from './stampList.json'

export default defineComponent({
  props: ['comment'],
  mounted() {
    
  }
})
</script>

<style lang="sass" scoped>

</style>