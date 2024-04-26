<template lang="pug">
header.global-navbar(:class='{ "not-at-top": notAtTop, hidden }')
  .flex
    a.side-nav-toggle.plain(@click='toggleSideNav')
      IFasBars(data-icon)

    .logo-area
      RouterLink.plain(to='/')
        img.site-logo(:src='LogoH')

    .flex.search-area(v-if='$route.name !== "search"')
      .search-full.align-right.flex-1
        SearchBox
      .search-icon.align-right.flex-1
        a.pointer.plain(@click='openSideNav')
          IFasSearch
          | &nbsp;搜索
    .flex.search-area(v-else)

    #global-nav__user-area.user-area
      .user-link
        a.dropdown-btn.plain.pointer(
          :class='{ "show-user": showUserDropdown }'
          @click.stop='showUserDropdown = !showUserDropdown'
        )
          img.avatar(
            :src='userStore.isLoggedIn ? userStore.userProfileImg : "/~/common/images/no_profile.png"',
            :title='userStore.isLoggedIn ? userStore.userId + " (" + userStore.userPixivId + ")" : "未登入"'
          )

        Transition(
          enter-active-class='fade-in-up'
          leave-active-class='fade-out-down'
          mode='out-in'
          name='fade'
        )
          .dropdown-content(v-show='showUserDropdown')
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
                  :to='{ name: "users", params: { id: userStore.userId }, query: { tab: "public_bookmarks" } }'
                ) 公开收藏
              li(v-if='userStore.isLoggedIn')
                RouterLink.plain(
                  :to='{ name: "users", params: { id: userStore.userId }, query: { tab: "hidden_bookmarks" } }'
                ) 私密收藏
              li(v-if='userStore.isLoggedIn')
                RouterLink.plain(
                  :to='{ name: "following", params: { id: userStore.userId } }'
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
import { logout } from './userData'
import LogoH from '@/assets/LogoH.png'
import { useSideNavStore, useUserStore } from '@/composables/states'

const hidden = ref(false)
const notAtTop = ref(false)
const showUserDropdown = ref(false)
const sideNavStore = useSideNavStore()
const userStore = useUserStore()

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

const router = useRouter()
router.afterEach(() => {
  showUserDropdown.value = false
})

onMounted(() => {
  window.addEventListener('scroll', () => {
    const newTop = document.documentElement.scrollTop
    if (newTop > 50) {
      notAtTop.value = true
    } else {
      notAtTop.value = false
    }
  })

  // Outside close user dropdown
  document.addEventListener('click', () => {
    showUserDropdown.value = false
  })
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
    font-size: 1.2rem
    text-align: center
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
        list-style: none
        display: flex
        align-items: center
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
    a
      color: var(--theme-accent-link-color)

@media (max-width: 450px)
  .global-navbar
    .search-full
      display: none
    .search-icon
      display: block
</style>
