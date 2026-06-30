<template lang="pug">
.novel-card.placeholder(v-if='loading')
  .cover: FnbSkeleton(block height='134px' width='96px')
  .info
    .title: FnbSkeleton(height='1.4em' text width='8em')
    .meta: FnbSkeleton(text width='6em')
.novel-card(v-else-if='item')
  RouterLink.cover(:to='`/novels/${item.id}`')
    DeferLoad.img(
      :alt='item.title',
      :src='item.url || fallbackCover',
      :title='item.title'
      lazyload
    )
    .restrict(aria-label='R-18' role='img' title='R-18' v-if='+item.xRestrict')
      IFasEye(aria-hidden='true')
  .info
    .title
      RouterLink(:title='item.title', :to='`/novels/${item.id}`') {{ item.title }}
    .author(:title='item.userName')
      RouterLink(:title='item.userName', :to='`/users/${item.userId}`') {{ item.userName }}
    .meta
      span(v-if='item.textCount') {{ item.textCount }} 字
      span(v-if='item.readingTime') {{ Math.ceil(item.readingTime / 60) }} 分钟
</template>

<script lang="ts" setup>
import DeferLoad from '~/components/DeferLoad.vue'
import IFasEye from '~icons/fa-solid/eye'
import type { NovelInfo } from '~/types'

defineProps<{
  item?: NovelInfo
  loading?: boolean
}>()

const fallbackCover =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 336"%3E%3Crect width="240" height="336" fill="%23eeeeee"/%3E%3Cpath d="M64 72h112v12H64zm0 38h112v10H64zm0 30h88v10H64zm0 30h104v10H64z" fill="%23bbbbbb"/%3E%3C/svg%3E'
</script>

<style scoped lang="scss">
.novel-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 0.85rem;
  width: 100%;
  max-width: 280px;
}

.cover {
  position: relative;
  display: block;
  overflow: hidden;
  @include fnb-border;
  @include fnb-shadow-xs;
  aspect-ratio: 5 / 7;
  background: var(--fnb-skeleton);
  animation: imgProgress 0.6s ease infinite alternate;

  :deep(img),
  .img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.restrict {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  color: var(--fnb-on-brand);
  width: 1.4rem;
  height: 1.4rem;
  font-size: 0.7rem;
  border-radius: var(--fnb-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--pixiv-r18-badge);
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
}

.title,
.author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 700;
}

.author,
.meta {
  color: var(--fnb-text-muted);
  font-size: 0.85rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
</style>
