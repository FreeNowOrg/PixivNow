<template lang="pug">
.author-card
  .author-inner(v-if='user')
    .flex-center
      .left
        RouterLink(:to='"/users/" + user.userId' :aria-label='"查看作者: " + user.name')
          img(:alt='user.name + " 的头像"' :src='user.imageBig')
      .right
        .flex
          h4.plain
            RouterLink(:to='"/users/" + user.userId') {{ user.name }}
          FnbButton(
            :loading='loadingUserFollow',
            :variant='user.isFollowed ? "success" : "default"'
            @click='handleUserFollow'
            size='sm'
            v-if='user.userId !== userStore.userId'
          )
            template(#icon)
              IFasCheck(v-if='user.isFollowed')
              IFasPlus(v-else)
            | {{ user.isFollowed ? '已关注' : '关注' }}
        FnbEllipsis.description.pre(:line-clamp='3' :tooltip='false') {{ user.comment }}
    ArtworkList.tiny(:list='user.illusts' inline)

  .author-placeholder(v-else)
    .flex-center
      .left: a: FnbSkeleton(circle height='80px' text width='80px')
      .right
        h4.plain: FnbSkeleton(height='1.6em' text width='12em')
        FnbSkeleton(block height='3em' width='100%')
    ArtworkList.tiny(:list='[]' inline loading)
</template>

<script lang="ts" setup>
import ArtworkList from './Artwork/ArtworkList.vue'
import type { User } from '~/types'
import IFasCheck from '~icons/fa-solid/check'
import IFasPlus from '~icons/fa-solid/plus'
import { useUserStore } from '~/stores/session'
import { useUserProfileStore } from '~/stores/user-profile'

const userStore = useUserStore()
const userProfileStore = useUserProfileStore()
const toast = useToast()

const props = defineProps<{
  user?: User
}>()

const loadingUserFollow = ref(false)
async function handleUserFollow() {
  if (!props.user || loadingUserFollow.value) return
  loadingUserFollow.value = true
  try {
    if (props.user.isFollowed) {
      await userProfileStore.unfollowUser(props.user.userId)
    } else {
      await userProfileStore.followUser(props.user.userId)
    }
    props.user.isFollowed = !props.user.isFollowed
  } catch {
    toast.error(
      props.user.isFollowed ? '取消关注失败，请重试' : '关注失败，请重试'
    )
  } finally {
    loadingUserFollow.value = false
  }
}
</script>

<style scoped lang="scss">
.left {
  margin-right: 1rem;

  img {
    border-radius: var(--fnb-radius-sm);
    @include fnb-border-sm;
    width: 80px;
    height: 80px;
  }
}

.right {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0.2rem 0;
    flex: 1;
    min-width: 0;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.description {
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.artworks-list .author) {
  display: none;
}
</style>
