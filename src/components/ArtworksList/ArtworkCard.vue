<template lang="pug">
.thumb
  .side-tags
    .x-restrict(v-if="item.xRestrict" title="R-18")
      fa(icon="eye")
    .page-count(
      v-if="item.pageCount > 1"
      :title="'共 ' + item.pageCount + ' 张'"
    )
      fa(icon="images")
      | {{ item.pageCount }}
    .bookmark(
      :class="{ bookmarked: item.bookmarkData }"
      @click="toggleBookmark"
    )
      fa(icon="heart")
  router-link(:to="'/artworks/' + item.id")
    lazy-load.img(
      :src="API_BASE + item.url"
      :alt="item.alt"
      :title="item.alt"
      lazyload
    )
    .hover-title {{ item.title }}
.info
  .title
    router-link(:to="'/artworks/' + item.id") {{ item.title }}
  .author(:title="item.userName")
    router-link(:to="'/users/' + item.userId")
      img.avatar(
        :src="API_BASE + (item.profileImageUrl)"
        lazyload
      )
      | {{ item.userName }}
</template>

<script lang="ts" setup>
import { API_BASE } from '../../config'
import LazyLoad from '../LazyLoad.vue'
import { addBookmark, removeBookmark } from '../../utils/artworkActions'

import type { ArtworkReduced } from '../../types'

const props = defineProps<{
  item: ArtworkReduced
}>()

function toggleBookmark(): void {
  const item = props.item
  if (item.bookmarkData) {
    removeBookmark(+item.bookmarkData.id)
  } else {
    addBookmark(+item.id)
  }
}
</script>

<style lang="sass">

.thumb
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
    transition: all 0.4s ease-in-out

  .bookmark
    cursor: pointer

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
    transition: all 0.4s ease-in-out

  &:hover a,
  & a.router-link-active
    &::before
      background-color: rgba(0, 0, 0, 0.2)

    img
      transform: scale(1.1)

    .hover-title
      opacity: 1

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

  .x-restrict
    top: .4rem
    left: .4rem
    color: #fff
    font-size: 0.8rem
    background-color: rgb(255, 0, 0, 0.8)
    width: 1.5rem
    height: 1.5rem
    border-radius: 50%
    display: flex
    align-items: center

  [data-icon]
    margin: 0 auto

  .bookmark
    bottom: 0.4rem
    right: 0.4rem
    font-size: 1.2rem
    color: #fff

    &.bookmarked
      color: var(--theme-bookmark-color)

.info
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
        font-weight: 600
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
