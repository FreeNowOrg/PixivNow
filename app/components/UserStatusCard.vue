<template lang="pug">
FnbCard.user-status-card(shadow='sm')
  //- Logged in
  .user-status(v-if='userStore.isLoggedIn')
    .user-identity
      RouterLink.plain(:to='"/users/" + userStore.userId')
        img.avatar(:src='userStore.userProfileImg', :alt='userStore.userName')
      .user-info
        .user-name
          RouterLink.plain(:to='"/users/" + userStore.userId') {{ userStore.userName }}
          FnbTag.premium-badge(v-if='userStore.user?.premium', color='var(--fnb-highlight)') Premium
        .user-id @{{ userStore.userPixivId }}
    .user-actions
      FnbButton(
        size='sm',
        tag='RouterLink',
        :to='`/users/${userStore.userId}?tab=public_bookmarks`'
      )
        template(#icon): ITablerBookmark
        | 收藏
      FnbButton(
        size='sm',
        tag='RouterLink',
        :to='`/users/${userStore.userId}/following`'
      )
        template(#icon): ITablerUsers
        | 关注
      FnbButton(
        size='sm',
        tag='RouterLink',
        to='/login'
      )
        template(#icon): ITablerKey
        | 令牌

  //- Not logged in
  .user-status.guest(v-else)
    .user-identity
      img.avatar(:src='noProfileImg', alt='游客')
      .user-info
        .user-name 游客
        .user-id 绑定令牌，同步您的 Pixiv 信息！
    .user-actions
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        :to='"/login?back=/"'
      )
        template(#icon): ITablerLogin
        | 登录
</template>

<script lang="ts" setup>
import { IconBookmark as ITablerBookmark, IconUsers as ITablerUsers, IconKey as ITablerKey, IconLogin as ITablerLogin } from '@tabler/icons-vue'
import { useUserStore } from '~/stores/session'
import { pximgS } from '~/utils/pximg'

const userStore = useUserStore()
const noProfileImg = pximgS('common/images/no_profile.png')
</script>

<style scoped lang="scss">
.user-status-card {
  padding: 0.75rem 1rem;
}

.user-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  @include fnb-border-sm;
  flex-shrink: 0;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-weight: 900;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  a {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.premium-badge {
  font-size: 0.7rem;
  font-weight: 900;
}

.user-id {
  font-size: 0.8rem;
  color: var(--fnb-text-muted);
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}
</style>
