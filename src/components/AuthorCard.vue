<template lang="pug">
card.author-card(title='')
  .flex-center
    .left
      router-link(:to='"/users/" + user.userId')
        img(:src='user.imageBig' alt='')
    .right
      .flex
        h4
          router-link(:to='"/users/" + user.userId') {{ user.name }}
        button
          | 关注&nbsp;
          i-fa-solid-plus
      p.description.pre {{ user.comment }}

  artwork-list.inline.tiny(:list='user.illusts')
</template>

<script lang="ts" setup>
import Card from './Card.vue'
import type { User } from '@/types'

defineProps<{
  user: User
}>()
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

  h4
    margin: 0.2rem 0
    flex: 1
    font-weight: 600

  button
    background-color: #efefef
    color: var(--theme-text-color)
    padding: 0.2rem 1rem
    border-radius: 1rem

.description
  width: 100%
  max-height: 80px
  overflow: auto
</style>
