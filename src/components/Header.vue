<template lang="pug">
header.globalNavbar(:class="{ notAtTop, isHide }")
  a.sideNavToggle.plain(@click="sideNavShow = true")
    fa(icon="bars")

  .logoArea
    router-link.plain(to="/")
      img.siteLogo(:src="LogoH")

  .flex
    .searchArea
      search-box

  .userArea
    details.userLink
      summary
        img.avatar(
          :src="userData ? userData.profileImg : API_BASE + '/~/common/images/no_profile.png'" 
          :title="userData ? userData.name + ' (' + userData.pixivId + ')' : '未登入'"
          )
        fa(icon="angle-down")
      .dropdown
        ul
          //- notLogIn
          li(v-if="!userData")
            .navUserCard
              .top
                .bannerBg
                img.avatar(:src="API_BASE + '/~/common/images/no_profile.png'")
              .details
                .name 游客
                .uid 绑定令牌，同步您的 Pixiv 信息！

          //- isLogedIn
          li(v-if="userData")
            .navUserCard
              .top
                .bannerBg
                router-link.plain.name(:to="'/users/' + userData.id")
                  img.avatar(:src="API_BASE + userData.profileImgBig")
              .details
                router-link.plain.name(:to="'/users/' + userData.id") {{ userData.name }}
                .uid @{{ userData.pixivId }}

          li(v-if="$route.path !== '/login'")
            router-link.plain(:to="'/login?back=' + $route.path") {{ userData ? '查看令牌' : '用户登入' }}
          li(v-if="userData")
            a.plain(@click="userLogout") 用户登出
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBox from './SearchBox.vue'
import { API_BASE } from '../config'
import { userData, userLogout } from './userData'
import SideNavigation, { sideNavShow } from './SideNav/SideNav.vue'
import LogoH from '../assets/LogoH.png'

export default defineComponent({
  name: 'com-header',
  components: {
    SearchBox,
    SideNavigation,
  },
  data() {
    return {
      API_BASE,
      notAtTop: false,
      isHide: false,
      userData,
      sideNavShow,
      LogoH,
    }
  },
  watch: {
    isHide() {
      if (this.isHide) {
        document.body.classList.add('globalNavbar_isHide')
      } else {
        document.body.classList.remove('globalNavbar_isHide')
      }
    },
  },
  mounted() {
    let scrollTop = document.documentElement.scrollTop
    window.addEventListener('scroll', () => {
      const newTop = document.documentElement.scrollTop

      // if (scrollTop > 600) {
      //   this.isHide = newTop - scrollTop > 0
      // } else {
      //   this.isHide = false
      // }

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
.globalNavbar
  background-color: var(--theme-accent-color)
  padding: 0.4rem
  color: var(--theme-background-color)
  display: flex
  align-items: center
  position: fixed
  height: 50px
  width: 100%
  box-sizing: border-box
  white-space: nowrap
  top: 0
  z-index: 100
  transition: all .8s ease

  .flex
    display: flex
    flex: 1
    overflow-x: auto
    align-items: center
    margin: 0 1.5rem

  &.notAtTop
    box-shadow: 0 2px 4px var(--theme-box-shadow-color)

  // &.isHide
  //   top: -52px

.sideNavToggle
  font-size: 1.2rem
  text-align: center
  margin: auto 0.5rem
  color: var(--theme-accent-link-color)
  cursor: pointer
  width: 2.4rem
  height: 2.4rem
  border-radius: 50%
  display: flex
  align-items: center

  &:hover
    background-color: rgba(255,255,255,0.2)

  [data-icon]
    margin: 0 auto

.logoArea
  .siteLogo
    height: 2.2rem
    width: auto

.searchArea
  flex: 1

.userArea
  margin-left: 0.5rem

  .avatar
    height: 2rem
    width: 2rem
    border-radius: 50%

  .userLink
    position: relative

    summary
      list-style: none
      display: flex
      align-items: center

    [data-icon]
      margin-left: 6px
      color: #fff
      transition: all 0.4s 

    .dropdown
      position: absolute
      top: 1.4rem
      right: 0
      padding: 0
      padding-top: 0.4rem
      width: 200px

      ul
        list-style: none
        padding: 4px
        background-color: #fff
        box-shadow: 0 0 4px #aaa
        border-radius: 4px

        li > *
          padding: 0.5rem

        li a
          display: block
          cursor: pointer

          &:hover
            background-color: var(--theme-tag-color)

    &[open]
      [data-icon]
        transform: rotateX(180deg)

.navUserCard
  border-bottom: 1px solid
  position: relative

  .bannerBg
    position: absolute
    top: calc(-0.4rem - 6px)
    left: -12px
    height: 56px
    width: calc(100% + 24px)
    background-color: rgba(var(--theme-accent-color--rgb), 0.1)
    z-index: 0

  a
    display: inline !important

  .avatar
    width: 68px
    height: 68px

  .details
    .name
      font-size: 1rem

    .uid
      font-size: 0.8rem
      color: #aaa
</style>
