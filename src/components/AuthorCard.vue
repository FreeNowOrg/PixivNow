<template lang="pug">
.author-card
  .author-inner(v-if='user')
    .flex-center
      .left
        RouterLink(:to='"/users/" + user.userId')
          img(:src='user.imageBig' alt='')
      .right
        .flex
          h4.plain
            RouterLink(:to='"/users/" + user.userId') {{ user.name }}
          NButton(
            :loading='loadingUserFollow',
            :type='user.isFollowed ? "success" : undefined'
            @click='handleUserFollow'
            round
            secondary
            size='small'
            v-if='user.userId !== userStore.userId'
          )
            template(#icon)
              IFasCheck(v-if='user.isFollowed')
              IFasPlus(v-else)
            | {{ user.isFollowed ? '已关注' : '关注' }}
        NEllipsis.description.pre(:line-clamp='3', :tooltip='false') {{ user.comment }}
    ArtworkList.tiny(:list='user.illusts' inline)

  .author-placeholder(v-else)
    .flex-center
      .left: a: NSkeleton(circle height='80px' text width='80px')
      .right
        h4.plain: NSkeleton(height='1.6em' text width='12em')
        NSkeleton(block height='3em' width='100%')
    ArtworkList.tiny(:list='[]' inline loading)
</template>

<script lang="ts" setup>
import ArtworkList from './ArtworksList/ArtworkList.vue'
import type { User } from '@/types'
import { addUserFollow, removeUserFollow } from '@/utils'
import { NButton, NEllipsis, NSkeleton } from 'naive-ui'
import IFasCheck from '~icons/fa-solid/check'
import IFasPlus from '~icons/fa-solid/plus'
import { useUserStore } from '@/composables/states'

const userStore = useUserStore()

const props = defineProps<{
  user?: User
}>()

const loadingUserFollow = ref(false)
function handleUserFollow() {
  if (!props.user || loadingUserFollow.value) return
  const user = props.user

  loadingUserFollow.value = true
  const isFollowed = user.isFollowed
  const handler = isFollowed ? removeUserFollow : addUserFollow
  handler(user.userId)
    .then(() => {
      user.isFollowed = !isFollowed
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
    font-weight: 700

:deep(.artworks-list .author)
  display: none
</style>
