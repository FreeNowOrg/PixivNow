<template lang="pug">
.follow-user-card
  .follow-user-inner(v-if='user')
    .flex-1.flex.gap-1
      .left
        RouterLink(:to='"/users/" + user.userId')
          img(:src='user.profileImageUrl' alt='')
      .right
        .username: h4.plain
          RouterLink(:to='"/users/" + user.userId') {{ user.userName }}
        .comment: NEllipsis.description.pre(:line-clamp='3', :tooltip='false') {{ user.userComment }}
        .action: NButton(
          :loading='loadingUserFollow',
          :type='user.following ? "success" : undefined'
          @click='handleUserFollow'
          round
          secondary
          size='small'
          v-if='user.userId !== userStore.userId'
        )
          template(#icon)
            IFasCheck(v-if='user.following')
            IFasPlus(v-else)
          | {{ user.following ? '已关注' : '关注' }}
    .user-artworks
      ArtworkList.tiny(:list='user.illusts' inline)

  .follow-user-inner.placeholder(v-else)
    .flex-1.flex.gap-1
      .left: a: NSkeleton(circle height='80px' text width='80px')
      .right
        h4.plain: NSkeleton(height='1.6em' text width='12em')
        NSkeleton(block height='6em' width='100%')
    .user-artworks: ArtworkList.tiny(:list='[]', :loading='4' inline)
</template>

<script lang="ts" setup>
import ArtworkList from './ArtworksList/ArtworkList.vue'
import type { User, UserListItem } from '@/types'
import { addUserFollow, removeUserFollow } from '@/utils'
import { NButton, NEllipsis, NSkeleton } from 'naive-ui'
import IFasCheck from '~icons/fa-solid/check'
import IFasPlus from '~icons/fa-solid/plus'
import { useUserStore } from '@/composables/states'

const userStore = useUserStore()

const props = defineProps<{
  user?: UserListItem
}>()

const loadingUserFollow = ref(false)
function handleUserFollow() {
  if (!props.user || loadingUserFollow.value) return
  const user = props.user

  loadingUserFollow.value = true
  const isFollowing = user.following
  const handler = isFollowing ? removeUserFollow : addUserFollow
  handler(user.userId)
    .then(() => {
      user.following = !isFollowing
    })
    .finally(() => {
      loadingUserFollow.value = false
    })
}
</script>

<style scoped lang="sass">
.follow-user-card
  overflow: hidden

.follow-user-inner
  display: flex
  gap: 1rem
  @media (max-width: 860px)
    flex-direction: column
    gap: 0.25rem

.left
  margin-right: 1rem
  img
    border-radius: 50%
    width: 80px
    height: 80px

.right
  flex: 1
  > div:not(:first-of-type)
    margin-top: 1rem

h4
  margin: 0.2rem 0
  padding-left: 0
  flex: 1
  font-weight: 700

:deep(.artworks-list .author)
  display: none
</style>
