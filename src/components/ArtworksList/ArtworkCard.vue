<template lang="pug">
.illustCard(v-if="illust.id")
  .top
    router-link(:to="'/artworks/' + illust.id")
      img(:src="'https://pixiv.js.org' + illust.url" :alt="illust.alt")
  .bottom
    h3.title(:title="illust.title")
      router-link(:to="'/artworks/' + illust.id") {{ illust.title }}
    .author(:title="illust.userName")
      router-link(:to="'/users/'+ illust.userId") @{{ illust.userName }}
    .tags
      router-link.tag(v-for="tagName in illust.tags", :to="'/search/' + tagName") \#{{ tagName }}

.illustCard(v-if="illust.isAdContainer")
  .top
    div(:style="{width: '100%', height: '240px', backgroundColor: '#efefef'}")
  .bottom
    h3.title 广告
    .author @Pixiv
    div 这里是 Pixiv 源站上的广告位，我们才不帮他们显示广告呢（笑
</template>

<script lang="ts">
export default {
  props: ['illust'],
}
</script>

<style scoped lang="sass">
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
  img
    width: 100%

.bottom
  // display: flex
  // max-height: 300px
  // flex-wrap: wrap

.title,
.author
  white-space: nowrap
  text-overflow: ellipsis
  overflow: hidden
  width: 100%
  padding-bottom: 2px

  a
    display: inline

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
