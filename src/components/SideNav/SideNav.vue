<template lang="pug">
aside.globalSideNav(:class="{isHide: !show}")
  .backdrop(@click="show = false")
  .inner
    .banner
      a.sideNavToggle.plain(@click="show = false")
        fa(icon="bars")
      router-link.plain(to="/")
        .logoArea
          .logo: span.ph
            .left Pixiv
            .right Now

    //- .group
    //-   .searchArea(style="padding: 0 1.6rem")
    //-     search-box

    .list
      .group
        .title 导航
        ul
          list-link(icon="home" link="/" text="首页")
          list-link.not-allowed(icon="image" link="" text="插画")
          list-link(icon="user" link="" text="用户")
          list-link(icon="crown" link="/ranking" text="排行榜")
      
      .group
        .title Pixiv 令牌
        ul
          li
            list-link(icon="fingerprint" link="/login" :text="userData ? '查看令牌' : '设置令牌'")
      
      .group
        .title PixivNow
        ul
          list-link(icon="external-link-alt" externalLink="https://www.pixiv.net/" text="Pixiv.net")
          list-link(icon="heart" link="/about" text="关于我们")
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export const sideNavShow = ref()
sideNavShow.value = false
import { userData } from '../userData'

import SearchBox from '../SearchBox.vue'
import ListLink from './ListLink.vue'

export default defineComponent({
  components: { SearchBox, ListLink },
  data() {
    return {
      show: sideNavShow,
      userData,
    }
  },
  watch: {
    show() {
      if (this.show) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'visible'
      }
    },
  },
  mounted() {
    this.$router.beforeEach(() => {
      this.show = false
    })
  },
})
</script>

<style scoped lang="sass">
.globalSideNav
  z-index: 50

.backdrop
  position: fixed
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  background-color: rgba(0, 0, 0, 0.1)
  z-index: 50

.inner
  position: fixed
  top: 0
  left: 0
  width: 240px
  max-width: 80vw
  height: 100vh
  background-color: #fff
  z-index: 60
  transition: all 0.5s

.sideNavToggle
  font-size: 1.2rem
  text-align: center
  margin: auto 0.5rem
  color: var(--theme-border-color)
  cursor: pointer
  width: 2.4rem
  height: 2.4rem
  border-radius: 50%
  display: flex
  align-items: center
  background-color: rgba(0,0,0,0.05)

  [data-icon]
    margin: 0 auto

.list
  max-height: calc(100vh - 56px)
  overflow-x: auto

.group
  margin: 0.5rem 0

  .title
    user-select: none
    padding: 0 1.6rem
    margin: 1.6rem 0 0.4rem 0
    font-weight: 600
    font-size: 0.8rem
    color: #aaa

  ul
    margin: 0
    list-style: none
    padding-left: 0

// Top banner
.banner
  height: 56px
  padding: 0.4rem
  display: flex
  align-items: center

// Logo
%ph-left-right-shared
  display: inline-block
  padding: 0.1rem
  margin: 0.1rem

.logo
  font-size: 1.2rem
  margin: 0 0.4rem
  text-decoration: none
  --color: var(--theme-accent-link-color)

.ph
  display: inline-block
  background-color: #252525
  border-radius: 4px
  padding: 0.2rem
  user-select: none
  white-space: nowrap

  .left
    @extend %ph-left-right-shared
    color: var(--theme-accent-link-color)

  .right
    @extend %ph-left-right-shared
    background-color: var(--theme-accent-color)
    color: var(--theme-accent-link-color)
    border-radius: 2px

// Hidden state
.isHide
  .inner
    left: -300px
  .backdrop
    display: none
</style>
