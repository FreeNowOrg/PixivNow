<template lang="pug">
header.globalNavbar(:class="{ notAtTop, isHide }")
  .logoArea
    .logo: span.ph
      .left Pixiv
      .right Now

  .flex
    .mainLinksArea
      router-link(to="/") Home
      | ·
      router-link(to="/artworks") Artworks
      | ·
      router-link(to="/ranking") Ranking
      | ·
      router-link(to="/about") About
    .searchArea
      search-box

  .userArea
    a.userLink
      img.avatar(
        :src="userData ? userData.profileImg : API_BASE + '/~/common/images/no_profile.png'" 
        :title="userData ? userData.name + ' (' + userData.pixivId + ')' : '未登入'"
        )
      .dropdown
        ul
          //- notLogIn
          li(v-if="!userData")
            .navUserCard
              .left
                img.avatar(:src="API_BASE + '/~/common/images/no_profile.png'")
              .right
                .title 匿名
          li(v-if="!userData && $route.path !== '/login'")
            router-link(:to="'/login?back=' + $route.path") 用户登入

          //- isLogedIn
          li(v-if="userData")
            .navUserCard
              .left
                img.avatar(:src="API_BASE + userData.profileImgBig")
              .right
                router-link.name(:to="'/users/' + userData.id") {{ userData.name }}
                .tag ({{ userData.pixivId }})
          li(v-if="userData")
            a(@click="userLogout") 用户登出
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBox from './SearchBox.vue'
import { API_BASE } from '../config'
import { userData, userLogout } from './userLogin'

export default defineComponent({
  name: 'com-header',
  components: {
    SearchBox,
  },
  data() {
    return {
      API_BASE,
      notAtTop: false,
      isHide: false,
      userData,
      // curPath: this.$route,
    }
  },
  mounted() {
    let scrollTop = document.documentElement.scrollTop
    window.addEventListener('scroll', () => {
      const newTop = document.documentElement.scrollTop

      if (scrollTop > 600) {
        this.isHide = newTop - scrollTop > 0
      } else {
        this.isHide = false
      }

      scrollTop = newTop

      if (newTop > 0) {
        this.notAtTop = true
      } else {
        this.notAtTop = false
      }
    })
  },
  methods: {
    userLogout,
  },
})
</script>

<style scoped lang="sass">
%logo-link-shared
  margin: 0 0.4rem
  text-decoration: none
  --color: var(--theme-accent-link-color)

%ph-left-right-shared
  display: inline-block
  padding: 0.1rem
  margin: 0.1rem

.globalNavbar
  background-color: var(--theme-accent-color)
  padding: 0.4rem
  color: var(--theme-background-color)
  display: flex
  align-items: center
  position: fixed
  width: 100%
  box-sizing: border-box
  white-space: nowrap
  top: 0
  z-index: 10
  transition: all .8s ease

  .flex
    display: flex
    flex: 1
    overflow-x: auto
    align-items: center

  &.notAtTop
    box-shadow: 0 2px 4px var(--theme-box-shadow-color)

  &.isHide
    top: -80px

.logoArea
  // word-break:

.logo
  @extend %logo-link-shared
  font-size: 1.2rem

.mainLinksArea
  flex: 1

  a
    @extend %logo-link-shared
    font-variant: small-caps
    font-size: 1.2rem

.searchArea
  // flex: 1

.userArea
  margin-left: 1rem

  .avatar
    height: 2rem
    width: 2rem
    border-radius: 50%

  .userLink
    position: relative

    .dropdown
      display: none
      position: absolute
      top: 1.4rem
      right: 0
      padding: 0
      padding-top: 0.4rem

      ul
        list-style: none
        padding: 4px
        background-color: #fff
        box-shadow: 0 0 4px #aaa

        li > *
          padding: 4px 8px

        li a
          display: block
          cursor: pointer

          &:hover
            background-color: var(--theme-tag-color)

    &:hover .dropdown
      display: block

.navUserCard
  display: flex
  border-bottom: 1px solid

  .avatar
    width: 50px
    height: 50px

  .right
    margin-left: 1rem
    display: flex
    align-items: center
    flex-wrap: wrap
    text-align: center

    > *
      width: 100%

    .name
      font-size: 1.2rem

    .tag
      font-size: 0.8rem
      color: #aaa

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
    border-radius: 2px
</style>
