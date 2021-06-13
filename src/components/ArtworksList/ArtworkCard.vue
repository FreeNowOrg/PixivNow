<template lang="pug">
.illustCard(v-if="illust.id")
  .top
    router-link(:to="'/artworks/' + illust.id")
      img(:src="'https://pixiv.js.org' + illust.url" :alt="illust.alt")
  .bottom
    h3.title
      router-link(:to="'/artworks/' + illust.id") {{ illust.title }}
    .author 
      router-link(:to="'/users/'+ illust.userId") @{{ illust.userName }}
    .tags
      router-link.tag(v-for="tagName in illust.tags", :to="'/search/' + tagName") \#{{ tagName }}

.illustCard(v-if="illust.isAdContainer")
  .top
    div(:style="{width: '200px', height: '200px', backgroundColor: '#efefef'}")
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
  background-color: var(--theme-background-color)
  box-shadow: 0 0 4px #ccc
  margin: 1rem
  padding: .4rem
  width: 200px
  // max-height: 60vh

.top
  img
    width: 100%

.bottom
  overflow-x: auto

.author
  margin: .4rem 0
  font-style: italic

.tags
  // word-break: break-word

  .tag
    display: inline-block
    margin: 2px
    padding: 2px 4px
    background-color: #d6e4ff
    border-radius: 4px
</style>
