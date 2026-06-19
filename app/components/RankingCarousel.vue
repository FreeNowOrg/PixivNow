<template lang="pug">
.ranking-carousel(
  @mouseenter='pause',
  @mouseleave='resume'
)
  .slides
    RouterLink.slide(
      v-for='(artwork, i) in artworks',
      :key='artwork.illust_id',
      :class='{ active: i === current }',
      :to='"/artworks/" + artwork.illust_id'
    )
      DeferLoad.slide-bg(:src='getImageUrl(artwork)')
      .slide-overlay
      .slide-content
        .rank \#{{ artwork.rank }}
        .slide-title {{ artwork.title }}
        .slide-meta
          span.author @{{ artwork.user_name }}
          span.views
            ITablerEye
            | {{ formatCount(artwork.view_count) }}
  .controls
    button.arrow.prev(@click='prev')
      ITablerChevronLeft
    .dots
      button.dot(
        v-for='(_, i) in artworks',
        :key='i',
        :class='{ active: i === current }',
        @click='goTo(i)'
      )
    button.arrow.next(@click='next')
      ITablerChevronRight
  .ranking-link
    RouterLink(to='/ranking') 查看完整排行榜 →
</template>

<script lang="ts" setup>
import DeferLoad from '~/components/DeferLoad.vue'
import { toRegularUrl } from '~/utils/pximg'
import { IconEye as ITablerEye, IconChevronLeft as ITablerChevronLeft, IconChevronRight as ITablerChevronRight } from '@tabler/icons-vue'
import type { ArtworkRank } from '~/types'

const props = defineProps<{ artworks: ArtworkRank[] }>()

const current = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function getImageUrl(artwork: ArtworkRank): string {
  return toRegularUrl(artwork.url)
}

function next() {
  current.value = (current.value + 1) % props.artworks.length
}

function prev() {
  current.value = (current.value - 1 + props.artworks.length) % props.artworks.length
}

function goTo(i: number) {
  current.value = i
}

function startTimer() {
  timer = setInterval(next, 5000)
}

function pause() {
  if (timer) { clearInterval(timer); timer = null }
}

function resume() {
  if (!timer) startTimer()
}

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

onMounted(startTimer)
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped lang="scss">
.ranking-carousel {
  @include fnb-border;
  @include fnb-shadow;
  position: relative;
  overflow: hidden;
  height: 360px;
  background: #000;
}

.slides {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
  display: flex;
  align-items: flex-end;
  text-decoration: none;
  color: #fff;

  &.active {
    opacity: 1;
    z-index: 1;
  }
}

.slide-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 40%, rgba(0, 0, 0, 0.7));
  z-index: 1;
}

.slide-content {
  position: relative;
  z-index: 2;
  padding: 1.5rem;
  width: 100%;

  .rank {
    font-family: var(--fnb-font-display);
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1;
    color: var(--fnb-highlight);
    text-shadow: 3px 3px 0 #000;
  }

  .slide-title {
    font-size: 1.25rem;
    font-weight: 900;
    margin: 0.25rem 0;
    text-shadow: 1px 1px 0 #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slide-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.9;

    .views {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
}

.arrow {
  background: none;
  border: 2px solid #fff;
  color: #fff;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
  box-shadow: none;
  transition: background 0.15s;

  &:hover {
    background: var(--fnb-bookmark);
    border-color: var(--fnb-bookmark);
    translate: 0;
    box-shadow: none;
  }
}

.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  background: transparent;
  padding: 0;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.15s;

  &.active {
    background: var(--fnb-bookmark);
    border-color: var(--fnb-bookmark);
  }

  &:hover {
    background: #fff;
    translate: 0;
    box-shadow: none;
  }
}

.ranking-link {
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  z-index: 3;
  font-size: 0.8rem;
  font-weight: 700;

  a {
    color: var(--fnb-highlight);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
