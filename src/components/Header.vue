<template lang="pug">
header.globalNavbar(:class='{ notAtTop, isHide }')
  .flex
    a.sideNavToggle.plain(@click='toggleSideNav')
      fa(icon='bars')

    .logoArea
      router-link.plain(to='/')
        img.siteLogo(:src='LogoH')

    .flex.searchArea
      .searchFull.align-right.flex-1
        SearchBox
      .searchIcon.align-right.flex-1
        button.pointer(@click='sideNavShow = true')
          fa(icon='search')
          | &nbsp;搜索

    #globalNav__userArea.userArea
      .userLink
        a.dropdownBtn.plain.pointer(
          :class='{ isShown: userDropdownShow }',
          @click='userDropdownShow = !userDropdownShow'
        )
          img.avatar(
            :src='userData ? userData.profileImg : API_BASE + "/~/common/images/no_profile.png"',
            :title='userData ? userData.name + " (" + userData.pixivId + ")" : "未登入"'
          )
          fa(icon='angle-down')

        transition(
          name='fade',
          mode='out-in',
          enter-active-class='fadeInUp',
          leave-active-class='fadeOutDown'
        )
          .dropdownContent(v-show='userDropdownShow')
            ul
              //- notLogIn
              li(v-if='!userData')
                .navUserCard
                  .top
                    .bannerBg
                    img.avatar(
                      :src='API_BASE + "/~/common/images/no_profile.png"'
                    )
                  .details
                    a.userName 游客
                    .uid 绑定令牌，同步您的 Pixiv 信息！

              //- isLogedIn
              li(v-if='userData')
                .navUserCard
                  .top
                    .bannerBg
                    router-link.plain.name(:to='"/users/" + userData.id')
                      img.avatar(:src='API_BASE + userData.profileImgBig')
                  .details
                    router-link.plain.userName(:to='"/users/" + userData.id') {{ userData.name }}
                    .uid @{{ userData.pixivId }}

              li(v-if='$route.path !== "/login"')
                router-link.plain(:to='"/login?back=" + $route.path') {{ userData ? "查看令牌" : "用户登入" }}
              li(v-if='userData')
                a.plain(@click='userLogout') 用户登出
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import SearchBox from './SearchBox.vue'
import { API_BASE } from '../config'
import { userData, userLogout } from './userData'
import LogoH from '../assets/LogoH.png'

const emit = defineEmits<{
  (
    e: 'toggle-sidenav',
    value: boolean
  ): void
}>()

const isHide = ref(false)
const notAtTop = ref(false)
const sideNavShow = ref(false)
const userDropdownShow = ref(false)

function toggleSideNav() {
  sideNavShow.value = !sideNavShow.value
  emit('toggle-sidenav', sideNavShow.value)
}

watch(isHide, (value) => {
  if (value) {
    document.body.classList.add('globalNavbar_isHide')
  } else {
    document.body.classList.remove('globalNavbar_isHide')
  }
})

onMounted(() => {
  // Scroll state
  let scrollTop = document.documentElement.scrollTop
  window.addEventListener('scroll', () => {
    const newTop = document.documentElement.scrollTop
    // if (scrollTop > 600) {
    //   this.isHide = newTop - scrollTop > 0
    // } else {
    //   this.isHide = false
    // }
    scrollTop = newTop
    if (newTop > 50) {
      notAtTop.value = true
    } else {
      notAtTop.value = false
    }
  })

  // Outside close user dropdown
  document
    .getElementById('globalNav__userArea')
    ?.addEventListener('click', (e) => e.stopPropagation())
    document.addEventListener('click', (e) => {
      if (userDropdownShow.value) userDropdownShow.value = false
    })
})
</script>

<style lang="sass">
.globalNavbar
  background-color: var(--theme-accent-color)
  padding: 0.4rem 1rem
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
    width: 100%
    gap: 1rem
    align-items: center

  &.notAtTop
    box-shadow: 0 0px 8px var(--theme-box-shadow-color)

  .sideNavToggle
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

  .logoArea
    .siteLogo
      height: 2.2rem
      width: auto

  .searchArea
    flex: 1

  .userArea
    .avatar
      height: 2rem
      width: 2rem
      border-radius: 50%

    .userLink
      position: relative

      .dropdownBtn
        list-style: none
        display: flex
        align-items: center

      [data-icon]
        margin-left: 6px
        color: #fff
        transition: all 0.4s

      .dropdownBtn.isShown
        [data-icon]
          transform: rotateZ(180deg)

      .dropdownContent
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
      .userName
        font-size: 1rem

      .uid
        font-size: 0.8rem
        color: #aaa

  .searchIcon
    display: none

@media screen and (max-width: 450px)
  .globalNavbar
    .searchFull
      display: none
    .searchIcon
      display: block
</style>
