<template lang="pug">
.artwork-large-card
  .top
    RouterLink.plain(:to='"/artworks/" + illust.id')
      .thumb(:style='thumbStyle')
        DeferLoad.image(
          :alt='illust.title',
          :src='illust.url'
        )
      .restrict.x-restrict(aria-label='R-18' role='img' title='R-18' v-if='illust.xRestrict === 2')
        IFasEye(aria-hidden='true')
      .restrict.ai-restrict(aria-label='AI生成' role='img' title='AI生成' v-if='illust.aiType === 2')
        IFasRobot(aria-hidden='true')
      .page-count(
        :title='"共 " + illust.pageCount + " 张"'
        v-if='+illust.pageCount > 1'
      )
        IFasImages(data-icon)
        | {{ illust.pageCount }}
      .ranking(
        :class='{ gold: illust.rank === 1, silver: illust.rank === 2, bronze: illust.rank === 3 }'
        v-if='illust.rank'
      ) {{ illust.rank }}
      .type-ugoira(v-if='illust.illustType === IllustType.UGOIRA'): IPlayCircle
  .bottom
    h3.title.plain(:title='illust.title')
      RouterLink(:to='"/artworks/" + illust.id') {{ illust.title }}
    .author(:title='illust.userName')
      RouterLink(:to='"/users/" + illust.userId')
        img.avatar(:alt='illust.userName' :src='illust.profileImageUrl' lazyload)
        | {{ illust.userName }}
    .tags
      ArtTag(:key='_', :tag='item' v-for='(item, _) in illust.tags')
</template>

<script lang="ts" setup>
import type { ArtworkInfo } from '~/types'
import { IllustType } from '~/utils/constants'
import DeferLoad from '../DeferLoad.vue'
import ArtTag from '../ArtTag.vue'
import IFasEye from '~icons/fa-solid/eye'
import IFasImages from '~icons/fa-solid/images'
import IFasRobot from '~icons/fa-solid/robot'
import IPlayCircle from '~icons/fa-solid/play-circle'

const props = defineProps<{
  illust: ArtworkInfo & { rank?: number; viewCount?: number }
}>()

// Preserve the artwork's natural aspect ratio (the list is a waterfall,
// so there is no need to crop to a square). Reserve the height up-front
// from the known dimensions to avoid layout shift before the image loads.
const thumbStyle = computed(() => {
  const w = +props.illust.width
  const h = +props.illust.height
  return { aspectRatio: w && h ? `${w} / ${h}` : '1 / 1' }
})
</script>

<style lang="scss">
h3 {
  margin-top: 0;
  margin-bottom: 0.25rem;
}

.artwork-large-card {
  display: block;
  @include fnb-border;
  @include fnb-shadow;
  @include fnb-press;
  background-color: var(--fnb-surface);
  width: 100%;
  box-sizing: border-box;
}

.top {
  position: relative;
  a {
    display: block;
  }
  .thumb {
    border-radius: var(--fnb-radius) var(--fnb-radius) 0 0;
    overflow: hidden;
    position: relative;
    width: 100%;
    animation: imgProgress 0.6s ease infinite alternate;
    .image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .page-count {
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 0.1rem 0.4rem;
    font-size: 0.7rem;
    border-radius: var(--fnb-radius-sm);
    [data-icon] {
      margin-right: 0.15rem;
    }
  }

  .restrict {
    position: absolute;
    color: var(--fnb-on-brand);
    width: 1.4rem;
    height: 1.4rem;
    font-size: 0.7rem;
    border-radius: var(--fnb-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .x-restrict {
    top: 0.4rem;
    left: 0.4rem;
    background-color: var(--pixiv-r18-badge);
  }
  .ai-restrict {
    bottom: 0.4rem;
    left: 0.4rem;
    background-color: var(--pixiv-ai-badge);
  }

  .ranking {
    position: absolute;
    top: -0.6rem;
    left: -0.6rem;
    font-family: var(--fnb-font-display);
    font-size: 1rem;
    font-weight: 900;
    color: var(--fnb-text);
    background-color: var(--fnb-surface);
    border: 2px solid var(--fnb-border);
    box-shadow: var(--fnb-shadow-xs);
    width: 1.8rem;
    height: 1.8rem;
    text-align: center;
    line-height: 1.7;
    &.gold {
      background-color: var(--fnb-highlight);
      color: var(--fnb-on-light);
    }
    &.silver {
      background-color: var(--fnb-silver);
      color: var(--fnb-on-light);
    }
    &.bronze {
      background-color: var(--fnb-bronze);
      color: var(--fnb-on-light);
    }
  }

  .type-ugoira {
    pointer-events: none;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    svg {
      position: absolute;
      bottom: 50%;
      right: 50%;
      color: #fff;
      width: 35%;
      height: 35%;
      transform: translate(50%, 50%);
      opacity: 0.75;
    }
  }
}

.bottom {
  padding: 0.5rem;
  .title a {
    display: inline;
  }
  .author a {
    display: inline-flex;
  }

  .title,
  .author {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
    padding-bottom: 2px;

    a {
      align-items: center;
      &.router-link-active {
        color: var(--fnb-text);
        font-weight: 600;
        font-style: normal;
        cursor: default;
        &::after {
          visibility: hidden;
        }
      }

      .avatar {
        display: inline-block;
        width: 2rem;
        height: 2rem;
        box-sizing: border-box;
        @include fnb-border-sm;
        margin-right: 0.4rem;
      }
    }
  }

  .author {
    margin: 0.4rem 0;
  }
  .tags {
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .fnb-tag.fnb-tag {
      font-size: 0.7rem;
      padding: 0.05rem 0.3rem;
    }
  }
}
</style>
