<template lang="pug">
.novel-card.placeholder(v-if='loading')
  .cover: FnbSkeleton(block height='134px' width='96px')
  .info
    .title: FnbSkeleton(text height='1.4em' width='8em')
    .meta: FnbSkeleton(text width='6em')
.novel-card(v-else-if='item')
  RouterLink.cover(:to='`/novels/${item.id}`')
    DeferLoad.img(
      :alt='item.title'
      :src='item.url || fallbackCover'
      :title='item.title'
      lazyload
    )
    .restrict(v-if='+item.xRestrict') R-18
  .info
    .title
      RouterLink(:to='`/novels/${item.id}`') {{ item.title }}
    .author(:title='item.userName')
      RouterLink(:to='`/users/${item.userId}`') {{ item.userName }}
    .meta
      span(v-if='item.textCount') {{ item.textCount }} 字
      span(v-if='item.readingTime') {{ Math.ceil(item.readingTime / 60) }} 分钟
</template>

<script lang="ts" setup>
import DeferLoad from '~/components/DeferLoad.vue'
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
  width: 280px;
  max-width: calc(100vw - 2rem);
}

.cover {
  position: relative;
  display: block;
  overflow: hidden;
  @include fnb-border;
  @include fnb-shadow-xs;
  aspect-ratio: 5 / 7;
  background: #eee;
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
  padding: 0.1rem 0.35rem;
  background: rgba(220, 0, 0, 0.86);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  @include fnb-border-sm;
  border-color: rgba(0, 0, 0, 0.5);
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
