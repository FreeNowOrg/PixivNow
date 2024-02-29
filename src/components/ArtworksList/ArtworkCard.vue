<template lang="pug">
.artwork-card-container
  .artwork-card.placeholder(v-if='loading')
    .artwork-image
      NSkeleton(block height='180px' width='180px')
    .artwork-info
      .title: a: NSkeleton(height='1.4em' text width='8em')
      .author: a
        NSkeleton.avatar(circle height='1.5em' text width='1.5em')
        NSkeleton(text width='4em')
  .artwork-card(v-else-if='item')
    .artwork-image
      .side-tags
        .restrict.x-restrict(title='R-18' v-if='item.xRestrict')
          IFasEye(data-icon)
        .restrict.ai-restrict(
          :title='`AI生成(${item.aiType})`'
          v-if='item.aiType === 2'
        )
          IFasRobot(data-icon)
        .page-count(
          :title='"共 " + item.pageCount + " 张"'
          v-if='item.pageCount > 1'
        )
          IFasImages(data-icon)
          | {{ item.pageCount }}
        .bookmark(
          :class='{ bookmarked: item.bookmarkData, disabled: loadingBookmark }'
          @click='handleBookmark'
        )
          IFasHeart(data-icon)
      RouterLink(:to='"/artworks/" + item.id')
        LazyLoad.img(
          :alt='item.alt',
          :src='item.url',
          :title='item.alt'
          lazyload
        )
        .hover-title {{ item.title }}
        .type-ugoira(v-if='item.illustType === IllustType.UGOIRA'): IPlayCircle
    .artwork-info
      .title
        RouterLink(:to='"/artworks/" + item.id') {{ item.title }}
      .author(:title='item.userName')
        RouterLink(:to='"/users/" + item.userId')
          img.avatar(:src='item.profileImageUrl' lazyload)
          | {{ item.userName }}
</template>

<script lang="ts" setup>
import LazyLoad from '../LazyLoad.vue'
import { addBookmark, removeBookmark } from '@/utils/artworkActions'
import { NSkeleton } from 'naive-ui'
import { IllustType } from '@/types'
import IFasEye from '~icons/fa-solid/eye'
import IFasHeart from '~icons/fa-solid/heart'
import IFasImages from '~icons/fa-solid/images'
import IFasRobot from '~icons/fa-solid/robot'
import IPlayCircle from '~icons/fa-solid/play-circle'

import type { ArtworkInfo } from '@/types'

const props = defineProps<{
  item?: ArtworkInfo
  loading?: boolean
}>()

const loadingBookmark = ref(false)
async function handleBookmark() {
  if (loadingBookmark.value) return
  loadingBookmark.value = true
  const item = props.item!
  try {
    if (item.bookmarkData) {
      await removeBookmark(item.bookmarkData.id).then(() => {
        item.bookmarkData = null
      })
    } else {
      await addBookmark(item.id).then((data) => {
        if (data.last_bookmark_id) {
          item.bookmarkData = { id: data.last_bookmark_id, private: false }
        }
      })
    }
  } catch (e) {
    console.warn('handleBookmark', e)
  } finally {
    loadingBookmark.value = false
  }
}
</script>

<style lang="sass">

.artwork-image
  position: relative
  overflow: hidden
  border-radius: 8px
  width: 100%
  height: 0
  padding-top: 100%
  animation: imgProgress 0.6s ease infinite alternate

  a
    position: absolute
    left: 0
    top: 0
    display: block

    &::before
      content: ''
      display: block
      position: absolute
        // background-color: rgba(0, 0, 0, 0.05)
      top: 0
      left: 0
      width: 100%
      height: 100%
      z-index: 1
      pointer-events: none
      transition: all 0.4s ease-in-out

  .img
    position: relative
    left: 0
    top: 0
    width: 100%
    height: 100%
    transition: all 0.25s ease-in-out

  .bookmark
    cursor: pointer
    &.disabled
      opacity: 0.7

  .hover-title
    z-index: 10
    color: #fff
    position: absolute
    left: 50%
    top: 50%
    transform: translateX(-50%) translateY(-50%)
    text-shadow: 0 0 4px #000
    font-weight: 600
    pointer-events: none
    opacity: 0
    transition: all 0.25s ease-in-out

  .type-ugoira
    position: absolute
    pointer-events: none
    top: 50%
    left: 50%
    font-size: 2.5rem
    color: #fff
    opacity: 0.75
    transform: translate(-50%, -50%)
    transition: all 0.25s ease-in-out

  &:hover a,
  & a.router-link-active
    &::before
      background-color: rgba(0, 0, 0, 0.2)
    img
      transform: scale(1.2)
    .hover-title
      opacity: 1
    .type-ugoira
      opacity: 0
      transform: translate(-50%, -50%) scale(1.5)

  .router-link-active
    cursor: default
    box-shadow: 0 0 0 2px #aaa

    & + .cover
      background-color: rgba(100, 100, 100, 0.6) !important

  .side-tags > *
    position: absolute
    z-index: 10

  [data-icon]
    font-size: 1em

  .page-count
    top: .4rem
    right: .4rem
    color: #fff
    background-color: rgba(0, 0, 0, 0.6)
    padding: .1rem .2rem
    border-radius: 4px
    font-size: 0.8rem

  [data-icon]
    margin-right: .2rem

  .restrict
    color: #fff
    font-size: 0.8rem
    width: 1.5rem
    height: 1.5rem
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

  .bookmark
    bottom: 0.4rem
    right: 0.4rem
    font-size: 1.2rem
    color: #fff

    &.bookmarked
      color: var(--theme-bookmark-color)

.artwork-info
  .title,
  .author
    white-space: nowrap
    text-overflow: ellipsis
    overflow: hidden
    width: 100%
    padding-bottom: 2px

    a
      align-items: center

      &.router-link-active
        color: var(--theme-text-color)
        font-weight: 700
        font-style: normal
        cursor: default

        &::after
          visibility: hidden

  .title
    margin: 0.4rem 0

    a
      display: inline
      font-weight: 600

  .author
    .avatar
      display: inline-block
      width: 1.5rem
      height: 1.5rem
      border: 2px solid #fff
      border-radius: 50%
      box-shadow: 0 0 4px #ccc
      margin-right: .4rem

    a
      font-size: 0.8rem
      font-style: italic
      display: inline-flex
</style>
