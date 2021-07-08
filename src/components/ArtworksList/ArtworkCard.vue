<template lang="pug">
.illustCard(v-if="illust.id")
  .top
    router-link(:to="'/artworks/' + illust.id")
      .thumb
        img(:src="API_BASE + illust.url" alt="")
      .xRestrict.tag(v-if="illust.xRestrict !== 0" title="R-18")
        fa(icon="eye")
      .pageCount(:title="'共 ' + illust.pageCount + ' 张'")
        fa(icon="images")
        | {{ illust.pageCount }}
  .bottom
    h3.title(:title="illust.title")
      router-link(:to="'/artworks/' + illust.id") {{ illust.title }}
    .author(:title="illust.userName")
      router-link(:to="'/users/'+ illust.userId")
        img.avatar(:src="API_BASE + illust.profileImageUrl")
        | {{ illust.userName }}
    .tags
      router-link.tag(v-for="tagName in illust.tags", :to="'/search/' + tagName") \#{{ tagName }}

.illustCard(v-if="illust.isAdContainer")
  .top
    div(:style="{width: '100%', paddingTop: '100%', backgroundColor: '#efefef'}")
  .bottom
    h3.title 广告
    .author @Pixiv
    div 这里是 Pixiv 源站上的广告位，我们才不帮他们显示广告呢（笑
</template>

<script lang="ts">
import { API_BASE } from '../../config'

export default {
  components: {},
  data() {
    return {
      API_BASE,
    }
  },
  props: ['illust'],
}
</script>

<style lang="sass">
h3
  margin-bottom: .4rem

.illustCard
  display: inline-block
  box-sizing: border-box
  box-shadow: 0 0 4px #ccc
  margin: 1rem
  padding: .4rem
  min-width: 250px
  max-width: 350px
  width: 12.5vw
  background-color: var(--theme-box-shadow)
  border-radius: 4px
  transition: all .24s ease-in-out

  &:hover
    box-shadow: var(--theme-box-shadow-hover)

.top
  position: relative

  a
    display: block

  .thumb
    position: relative
    width: 100%
    height: 0
    padding-top: 100%
    animation: imgProgress 0.6s ease infinite alternate

    img
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%

  .pageCount
    position: absolute
    top: .4rem
    right: .4rem
    color: #fff
    background-color: rgba(0, 0, 0, 0.6)
    padding: .2rem .6rem
    border-radius: 1rem

    [data-icon]
      margin-right: .2rem

  .xRestrict
    position: absolute
    top: .4rem
    left: .4rem
    color: #fff
    background-color: rgb(255, 0, 0, 0.8)
    padding: .4rem
    border-radius: 50%

.bottom
  // display: flex
  // max-height: 300px
  // flex-wrap: wrap

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

    &.router-link-active
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
  font-style: italic

.tags
  overflow: auto
  max-height: 140px

  .tag
    display: inline-block
    margin: 2px
    padding: 2px 4px
    background-color: #d6e4ff
    border-radius: 4px
</style>
