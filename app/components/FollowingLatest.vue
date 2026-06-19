<template lang="pug">
.following-latest
  h3.section-title
    ITablerUsers
    | 关注更新
  FnbCard(shadow='sm')
    //- Loading
    template(v-if='loading')
      .following-item(v-for='i in 4', :key='i')
        FnbSkeleton(width='48px', height='48px')
        .following-item-info
          FnbSkeleton(text, width='8em', height='1em')
          FnbSkeleton(text, width='5em', height='0.8em')

    //- Logged in with artworks
    template(v-else-if='artworks.length')
      RouterLink.following-item(
        v-for='item in artworks',
        :key='item.id',
        :to='"/artworks/" + item.id'
      )
        DeferLoad.following-thumb(:src='item.url', :alt='item.alt')
        .following-item-info
          .following-item-title {{ item.title }}
          .following-item-author @{{ item.userName }}
      .following-more
        RouterLink(to='/following/latest') 更多 →

    //- Not logged in
    .following-empty(v-else-if='!loggedIn')
      p 登录后查看关注用户的最新作品
      FnbButton(
        size='sm',
        variant='primary',
        tag='RouterLink',
        to='/login?back=/'
      )
        template(#icon): ITablerLogin
        | 登录

    //- Logged in but no follows
    .following-empty(v-else)
      p 还没有关注任何用户
</template>

<script lang="ts" setup>
import DeferLoad from '~/components/DeferLoad.vue'
import { IconUsers as ITablerUsers, IconLogin as ITablerLogin } from '@tabler/icons-vue'
import type { ArtworkInfo } from '~/types'

defineProps<{
  artworks: ArtworkInfo[]
  loading: boolean
  loggedIn: boolean
}>()
</script>

<style scoped lang="scss">
.section-title {
  font-family: var(--fnb-font-display);
  font-weight: 900;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.following-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  text-decoration: none;
  color: var(--fnb-text);
  transition: background 0.15s;

  &:hover {
    background: var(--fnb-highlight);
    margin: 0 -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  & + .following-item {
    border-top: 1px solid var(--fnb-border);
  }
}

.following-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  @include fnb-border-sm;
  flex-shrink: 0;
}

.following-item-info {
  min-width: 0;
  flex: 1;
}

.following-item-title {
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.following-item-author {
  font-size: 0.8rem;
  color: var(--fnb-text-muted);
  font-style: italic;
}

.following-more {
  text-align: right;
  padding-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;

  a {
    color: var(--fnb-brand);
  }
}

.following-empty {
  text-align: center;
  padding: 1rem 0;
  color: var(--fnb-text-muted);

  p {
    margin-bottom: 0.75rem;
  }
}
</style>
