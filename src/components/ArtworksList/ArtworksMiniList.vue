<template lang="pug">
ul.artworksMiniList
  li(v-for="(item, index) in list"
    :key="item.id"
    :class="{ isAdContainer: item.isAdContainer }"
  )
    .thumb
      .sideTags
        .xRestrict(v-if="item.xRestrict" title="R-18")
          fa(icon="eye")
        .pageCount(
          v-if="item.pageCount"
          :title="'共 ' + item.pageCount + ' 张'"
        )
          fa(icon="images")
          | {{ item.pageCount }}
        .bookmark(
          v-if="!item.isAdContainer"
          :class="{ isBookmarked: item.bookmarkData }"
          @click="toggleBookmark(index)"
        )
          fa(icon="heart")
      router-link(
        v-if="item.id"
        :to="'/artworks/' + (illust.id || illust.illustId)"
        )
        img(
          :src="API_BASE + item.url"
          :alt="item.alt"
          :title="item.alt"
          lazyload=""
        )
        .hoverTitle {{ item.title }}
    .info
      .title
        a.plain.isAdContainer(v-if="item.isAdContainer") 广告
        router-link(v-if="item.id", :to="'/artworks/' + item.id") {{ item.title }}
      .author(:title="item.userName")
        router-link(v-if="item.id", :to="'/users/' + item.userId")
          img.avatar(
            :src="API_BASE + (item.profileImageUrl || item.profileImg)"
            lazyload=""
          )
          | {{ item.userName }}
        a.plain.isAdContainer(v-if="item.isAdContainer")
          | 我是一个广告
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { API_BASE } from "../../config"
import { addBookmark, removeBookmark } from "../../utils/artworkActions"

export default defineComponent({
  data() {
    return {
      API_BASE,
    }
  },
  props: ["list"],
  methods: {
    toggleBookmark(index: number) {
      const item = this.list[index]
      if (!item.bookmarkData) {
        addBookmark(item.id)
      }
      else {
        removeBookmark(item.id)
      }
    }
  }
})
</script>

<style scoped lang="sass">
.artworksMiniList
  list-style: none
  padding-left: 0
  display: flex
  flex-wrap: wrap
  gap: 1.5rem
  justify-content: center

  &.inline
    overflow-y: auto
    white-space: nowrap
    display: block

    li:not(:first-of-type)
      margin-left: 0.75rem

  li
    width: 180px
    max-width: calc(50vw - 2rem)
    display: inline-block

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

    img
      position: relative
      left: 0
      top: 0
      width: 100%
      height: 100%
      transition: all 0.4s ease-in-out

    .bookmark
      cursor: pointer

    .hoverTitle
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

      .hoverTitle
        opacity: 1

  .title
    margin: 0.4rem 0
    text-overflow: ellipsis
    overflow: hidden

    a
      display: inline
      font-weight: 600

  .author
    img
      width: 1.5rem
      height: 1.5rem

    a
      font-size: 0.8rem
      display: inline-flex

.tiny
  gap: 0.75rem

  li
    width: 100px

  .info
    display: none

.thumb .router-link-active
  cursor: default
  box-shadow: 0 0 0 2px #aaa

  & + .cover
    background-color: rgba(100, 100, 100, 0.6) !important

.sideTags > *
  position: absolute
  z-index: 10

  [data-icon]
    font-size: 1em

.pageCount
  top: .4rem
  right: .4rem
  color: #fff
  background-color: rgba(0, 0, 0, 0.6)
  padding: .1rem .2rem
  border-radius: 4px
  font-size: 0.8rem

  [data-icon]
    margin-right: .2rem

.xRestrict
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

  &.isBookmarked
    color: var(--theme-bookmark-color)

.isAdContainer
  a
    color: var(--theme-text-color)
    cursor: default

  .thumb
    background-color: #efefef
    animation: none
</style>
