<template lang="pug">
.artwork-large-card
  .top
    RouterLink.plain(:to='"/artworks/" + illust.id')
      .thumb
        LazyLoad.image(
          :alt='illust.title',
          :src='illust.url.replace("p0_master", "p0_square")'
        )
      .restrict.x-restrict(title='R-18' v-if='illust.xRestrict === 2')
        IFasEye(data-icon)
      .restrict.ai-restrict(title='AI生成' v-if='illust.aiType === 2')
        IFasRobot(data-icon)
      .page-count(
        :title='"共 " + illust.pageCount + " 张"'
        v-if='+illust.pageCount > 1'
      )
        IFasImages(data-icon)
        | {{ illust.pageCount }}
      .ranking(
        :class='{ gold: rank === 1, silver: rank === 2, bronze: rank === 3 }'
        v-if='rank !== 0'
      ) {{ rank }}
      .type-ugoira(v-if='illust.illustType === IllustType.UGOIRA'): IPlayCircle
  .bottom
    h3.title.plain(:title='illust.title')
      RouterLink(:to='"/artworks/" + illust.id') {{ illust.title }}
    .author(:title='illust.userName')
      RouterLink(:to='"/users/" + illust.userId')
        img.avatar(:src='illust.profileImageUrl' lazyload)
        | {{ illust.userName }}
    .tags
      ArtTag(:key='_', :tag='item' v-for='(item, _) in illust.tags')
</template>

<script lang="ts" setup>
import { type ArtworkInfo, IllustType } from '@/types'
import LazyLoad from '../LazyLoad.vue'
import ArtTag from '../ArtTag.vue'
import IFasEye from '~icons/fa-solid/eye'
import IFasImages from '~icons/fa-solid/images'
import IFasRobot from '~icons/fa-solid/robot'
import IPlayCircle from '~icons/fa-solid/play-circle'

defineProps<{
  illust: ArtworkInfo
  rank: number
}>()
</script>

<style lang="sass">
h3
  margin-bottom: .4rem

.artwork-large-card
  display: block
  border: 1px solid #eee
  background-color: var(--theme-background-color)
  border-radius: 0.5rem
  transition: all .24s ease-in-out
  margin: 0.5rem auto
  --parent-width: calc(100vw - 2rem)
  --counts: 1
  width: calc((var(--parent-width) - calc(var(--counts) - 1) * 2rem) / var(--counts))
  @media (max-width: 380px)
    width: 100%
  @media (min-width: 380px)
    --counts: 2
  @media (min-width: 640px)
    --counts: 3
  @media (min-width: 750px)
    --counts: 4
  @media (min-width: 1200px)
    --counts: 5
  @media (min-width: 1600px)
    --counts: 6

.top
  position: relative
  a
    display: block
  .thumb
    border-radius: 0.5rem 0.5rem 0 0
    overflow: hidden
    position: relative
    width: 100%
    height: 0
    padding-top: 100%
    animation: imgProgress 0.6s ease infinite alternate
    .image
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%

  .page-count
    position: absolute
    top: .4rem
    right: .4rem
    color: #fff
    background-color: rgba(0, 0, 0, 0.6)
    padding: .2rem .6rem
    border-radius: 0.2rem
    [data-icon]
      margin-right: .2rem

  .restrict
    position: absolute
    color: #fff
    width: 2rem
    height: 2rem
    border-radius: 50%
    display: flex
    align-items: center
    [data-icon]
      margin: 0 auto
  .x-restrict
    top: .4rem
    left: .4rem
    background-color: rgb(255, 0, 0, 0.8)
  .ai-restrict
    bottom: .4rem
    left: .4rem
    background-color: rgba(204, 102, 0, 0.8)

  .ranking
    position: absolute
    top: -0.9rem
    left: -0.89rem
    font-size: 1.2rem
    color: #252525
    background-color: #fff
    border-radius: 50%
    width: 1.8rem
    height: 1.8rem
    text-align: center
    line-height: 1.6
    --ring-color: rgba(var(--theme-accent-color--rgb), 0.4)
    box-shadow: 0 0 0 1px var(--ring-color) inset, 0 0 0 2px #fff
    &.gold
      --ring-color: gold
    &.silver
      --ring-color: darkgray
    &.bronze
      --ring-color: #b87333

  .type-ugoira
    pointer-events: none
    position: absolute
    width: 100%
    height: 100%
    left: 0
    top: 0
    svg
      position: absolute
      bottom: 50%
      right: 50%
      color: #fff
      width: 35%
      height: 35%
      transform: translate(50%, 50%)
      opacity: 0.75

.bottom
  padding: 0.5rem
  .title a
    display: inline
  .author a
    display: inline-flex

  .title,
  .author
    white-space: nowrap
    text-overflow: ellipsis
    overflow: hidden
    width: 100%
    padding-bottom: 2px

    a
      align-items: center
      &.RouterLink-active
        color: var(--theme-text-color)
        font-weight: 600
        font-style: normal
        cursor: default
        &::after
          visibility: hidden

      .avatar
        display: inline-block
        width: 2rem
        height: 2rem
        box-sizing: border-box
        border: 2px solid #fff
        border-radius: 50%
        box-shadow: 0 0 4px #ccc
        margin-right: .4rem

  .author
    margin: .4rem 0
  .tags
    overflow: hidden
</style>
