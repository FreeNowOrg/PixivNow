<template lang="pug">
header.globalNavbar(:class="{ notAtTop, isHide }")
  .logoArea
    .logo: span.ph
      .left Pixiv
      .right Now
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

  .userArea.notLogIn(v-if="!user")
    a.userLink
      img.avatar(:src="API_BASE + '/~/common/images/no_profile.png?' + Date.now()")
      ul.dropdown
        li
          a(@click="userLogin") 用户登入
  .userArea.isLogedIn(v-if="user")
    a.userLink(:title="user.name + '(' + user.pixivId + ')'")
      img.avatar(:src="user.profileImg")
      ul.dropdown
        li
          router-link(:to="'/users/' + user.id") {{ user.name }}
        li
          a(@click="userLogout") 用户登出
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBox from './SearchBox.vue'
import * as Cookies from 'js-cookie'
import axios from 'axios'
import { API_BASE } from '../config'

declare global {
  interface Window {
    PixivUser: {
      id: string
      pixivId: string
      name: string
      profileImg: string
      profileImgBig: string
      premium: boolean
      xRestrict: 0 | 1 | 2
      adult: boolean
      safeMode: boolean
      illustCreator: boolean
      novelCreator: boolean
    } | null
  }
}

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
      user: null,
    }
  },
  methods: {
    userInit() {
      const token = Cookies.get('PHPSESSID')
      if (!token) return
      axios.get(`${API_BASE}/api/user`).then(
        ({ data }) => {
          console.log('Log in', data)
          this.user = data
          window.PixivUser = data
        },
        (err) => {
          console.warn('Log in failed', err)
        }
      )
    },
    userLogin() {
      const token = prompt(
        '请输入您的 Pixiv 令牌\n在 www.pixiv.net 登录后使用 document.cookie.PHPSESSID 获取)'
      )
      if (!token) return
      Cookies.set('PHPSESSID', token, {
        expires: 180,
        path: '/',
      })
      location.reload()
    },
    userLogout() {
      const token = Cookies.get('PHPSESSID')
      if (token && confirm(`您要移除您的令牌吗？\n${token}`)) {
        // window.PixivUser = null
        Cookies.remove('PHPSESSID')
        location.reload()
      }
    },
  },
  mounted() {
    this.userInit()

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
  overflow-y: auto
  align-items: center
  position: fixed
  width: 100%
  box-sizing: border-box
  white-space: nowrap
  top: 0
  z-index: 10
  transition: all .8s ease

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
      top: 2rem
      right: 0
      background: #fff
      list-style: none
      padding: 0
      
    &:hover .dropdown
      display: block

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
