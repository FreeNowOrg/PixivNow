<template lang="pug">
header.global-navbar(:class='{ "not-at-top": notAtTop, hidden }')
  .flex
    button.side-nav-toggle.plain(
      aria-label='打开导航菜单'
      title='导航菜单'
      @click='toggleSideNav'
    )
      IFasBars(aria-hidden='true')

    .logo-area
      RouterLink.plain(to='/')
        img.site-logo(:src='LogoH')

    .flex.search-area(v-if='$route.name !== "search"')
      .search-full.align-right.flex-1
        SearchBox
      .search-icon.align-right.flex-1
        button.pointer.plain(
          aria-label='搜索'
          title='搜索'
          @click='openSideNav'
        )
          IFasSearch(aria-hidden='true')
          | &nbsp;搜索
    .flex.search-area(v-else)

    #global-nav__user-area.user-area
      .user-link(ref='userLinkRef')
        button.dropdown-btn.plain.pointer(
          :aria-expanded='showUserDropdown'
          :aria-label='userStore.isLoggedIn ? "用户菜单: " + userStore.userName : "用户菜单"'
          :class='{ "show-user": showUserDropdown }'
          :title='userStore.isLoggedIn ? userStore.userId + " (" + userStore.userPixivId + ")" : "未登入"'
          @click='showUserDropdown = !showUserDropdown'
        )
          img.avatar(
            :alt='userStore.isLoggedIn ? userStore.userName : "未登入"'
            :src='userStore.isLoggedIn ? userStore.userProfileImg : "/~/common/images/no_profile.png"'
          )

        .dropdown-content(:class='{ visible: showUserDropdown }')
          ul
              //- notLogIn
              li(v-if='!userStore.isLoggedIn')
                .nav-user-card
                  .top
                    .banner-bg
                    img.avatar(:src='"/~/common/images/no_profile.png"')
                  .details
                    a.user-name 游客
                    .uid 绑定令牌，同步您的 Pixiv 信息！

              //- isLogedIn
              li(v-if='userStore.isLoggedIn')
                .nav-user-card
                  .top
                    .banner-bg
                    RouterLink.plain.name(:to='"/users/" + userStore.userId')
                      img.avatar(:src='userStore.userProfileImgBig')
                  .details
                    RouterLink.plain.user-name(
                      :to='"/users/" + userStore.userId'
                    ) {{ userStore.userName }}
                    .uid @{{ userStore.userPixivId }}

              li(v-if='userStore.isLoggedIn')
                RouterLink.plain(
                  :to='`/users/${userStore.userId}?tab=public_bookmarks`'
                ) 公开收藏
              li(v-if='userStore.isLoggedIn')
                RouterLink.plain(
                  :to='`/users/${userStore.userId}?tab=hidden_bookmarks`'
                ) 私密收藏
              li(v-if='userStore.isLoggedIn')
                RouterLink.plain(
                  :to='`/users/${userStore.userId}/following`'
                ) 我的关注
              li(v-if='$route.path !== "/login"')
                RouterLink.plain(:to='"/login?back=" + $route.path') {{ userStore.isLoggedIn ? '查看令牌' : '用户登入' }}
              li(v-if='userStore.isLoggedIn')
                a.plain(@click='logoutUser') 用户登出
</template>

<script lang="ts" setup>
import SearchBox from './SearchBox.vue'
import IFasBars from '~icons/fa-solid/bars'
import IFasSearch from '~icons/fa-solid/search'
import { logout } from '~/composables/userData'
import LogoH from '~/assets/LogoH.png'
import { useSideNavStore, useUserStore } from '~/stores/session'

const hidden = ref(false)
const notAtTop = ref(false)
const showUserDropdown = ref(false)
const userLinkRef = ref<HTMLElement | null>(null)
const sideNavStore = useSideNavStore()
const userStore = useUserStore()

// Close dropdown when clicking outside .user-link
onClickOutside(userLinkRef, () => {
  showUserDropdown.value = false
})

// Close dropdown on route change
const router = useRouter()
router.afterEach(() => {
  showUserDropdown.value = false
})

function toggleSideNav() {
  sideNavStore.toggle()
}

function openSideNav() {
  sideNavStore.open()
}

function logoutUser() {
  logout()
  userStore.logout()
}

watch(hidden, (value) => {
  if (value) {
    document.body.classList.add('global-navbar_hidden')
  } else {
    document.body.classList.remove('global-navbar_hidden')
  }
})

useEventListener(window, 'scroll', () => {
  notAtTop.value = document.documentElement.scrollTop > 50
})
</script>

<style lang="sass">

.global-navbar
  background-color: var(--theme-accent-color)
  padding: 0.4rem 1rem
  color: var(--theme-background-color)
  display: flex
  align-items: center
  position: sticky
  height: 50px
  width: 100%
  box-sizing: border-box
  white-space: nowrap
  top: 0
  z-index: 100
  transition: all .8s ease

  .flex
    display: flex
    width: 100%
    gap: 1rem
    align-items: center

  &.not-at-top
    box-shadow: 0 0px 8px var(--theme-box-shadow-color)

  .side-nav-toggle
    border: none
    background: none
    padding: 0
    font: inherit
    font-size: 1.2rem
    text-align: center
    color: var(--theme-accent-link-color)
    cursor: pointer
    width: 2.4rem
    height: 2.4rem
    border-radius: 50%
    display: flex
    align-items: center
    justify-content: center

    &:hover
      background-color: rgba(255,255,255,0.2)
    &:focus-visible
      outline: 2px solid #fff
      outline-offset: 2px

  .logo-area
    .site-logo
      height: 2.2rem
      width: auto

  .search-area
    flex: 1

  .user-area
    .avatar
      height: 2rem
      width: 2rem
      border-radius: 50%

    .user-link
      position: relative

      .dropdown-btn
        border: none
        background: none
        padding: 0
        font: inherit
        cursor: pointer
        list-style: none
        display: flex
        align-items: center
        &:focus-visible
          outline: 2px solid #fff
          outline-offset: 2px
        .avatar
          box-shadow: 0 0 0 2px #fff
          transition: box-shadow 0.24s ease
        &.show-user
          .avatar
            box-shadow: 0 0 0 2px var(--theme-secondary-color)

      .dropdown-content
        position: absolute
        top: 1.4rem
        right: 0
        padding: 0
        padding-top: 0.4rem
        width: 200px
        opacity: 0
        transform: translateY(-0.5rem)
        pointer-events: none
        transition: opacity 0.25s ease, transform 0.25s ease
        &.visible
          opacity: 1
          transform: translateY(0)
          pointer-events: auto

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

  .nav-user-card
    border-bottom: 1px solid
    position: relative

    .top
      position: relative

      .banner-bg
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
      .user-name
        font-size: 1rem

      .uid
        font-size: 0.8rem
        color: #aaa

  .search-icon
    display: none
    button
      border: none
      background: none
      padding: 0
      font: inherit
      color: var(--theme-accent-link-color)
      cursor: pointer
      &:focus-visible
        outline: 2px solid #fff
        outline-offset: 2px

// Home page: transparent navbar, search hidden until scrolled
[data-route="home"]
  .global-navbar
    background: none
    .search-area
      opacity: 0
      transition: opacity 0.4s ease
      pointer-events: none

    &.not-at-top
      background-color: var(--theme-accent-color)
      .search-area
        opacity: 1
        pointer-events: all

@media (max-width: 450px)
  .global-navbar
    .search-full
      display: none
    .search-icon
      display: block
</style>
