<template lang="pug">
card.author-card(:data-user-is-followed='user.isFollowed' title='')
  .flex-center
    .left
      RouterLink(:to='"/users/" + user.userId')
        img(:src='user.imageBig' alt='')
    .right
      .flex
        h4
          RouterLink(:to='"/users/" + user.userId') {{ user.name }}
        button(:disabled='loadingUserFollow' @click='handleUserFollow')
          i-fa-solid-check(v-if='user.isFollowed')
          i-fa-solid-plus(v-else)
          |
          | {{ user.isFollowed ? '已关注' : '关注' }}
      p.description.pre {{ user.comment }}

  ArtworkList.inline.tiny(:list='user.illusts')
</template>

<script lang="ts" setup>
import Card from './Card.vue'
import ArtworkList from './ArtworksList/ArtworkList.vue'
import type { User } from '@/types'
import { addUserFollow, removeUserFollow } from '@/utils'

const props = defineProps<{
  user: User
}>()

const loadingUserFollow = ref(false)
function handleUserFollow() {
  loadingUserFollow.value = true
  const isFollowed = props.user.isFollowed
  const handler = isFollowed ? removeUserFollow : addUserFollow
  handler(props.user.userId)
    .then(() => {
      props.user.isFollowed = !isFollowed
    })
    .finally(() => {
      loadingUserFollow.value = false
    })
}
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
