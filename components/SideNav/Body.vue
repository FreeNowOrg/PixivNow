<template lang="pug">
aside.global-side-nav(:class='{ hidden: !sideNavStore.isOpened }')
  .backdrop(@click='closeSideNav')
  .inner
    .group
      .search-area
        SearchBox

    .list
      .group
        .title 导航
        ul
          SideNavListLink(link='/' text='首页')
            IHome.svg--SideNavListLink
          SideNavListLink.not-allowed(link='' text='插画')
            IImage.svg--SideNavListLink
          SideNavListLink(link='' text='用户')
            IUser.svg--SideNavListLink
          SideNavListLink(link='/ranking' text='排行榜')
            ICrown.svg--SideNavListLink

      .group
        .title 用户
        ul
          SideNavListLink(
            :text='userStore.isLoggedIn ? "查看令牌" : "设置令牌"'
            link='/login'
          )
            IFingerprint.svg--SideNavListLink

      .group
        .title PixivNow
        ul
          SideNavListLink(
            externalLink='https://www.pixiv.net/'
            text='Pixiv.net'
          )
            IExternalLinkAlt.svg--SideNavListLink
          SideNavListLink(link='/about' text='关于我们')
            IHeart.svg--SideNavListLink
</template>

<script lang="ts" setup>
import ICrown from '~icons/fa-solid/crown'
import IExternalLinkAlt from '~icons/fa-solid/external-link-alt'
import IFingerprint from '~icons/fa-solid/fingerprint'
import IHeart from '~icons/fa-solid/heart'
import IHome from '~icons/fa-solid/home'
import IImage from '~icons/fa-solid/image'
import IUser from '~icons/fa-solid/user'

const sideNavStore = useSideNavStore()
const userStore = useUserStore()
const router = useRouter()
router.afterEach(() => sideNavStore.close())

sideNavStore.$subscribe((_mutation, state): void => {
  if (state.openState) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'visible'
  }
})

function closeSideNav() {
  sideNavStore.close()
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSideNav()
  })
})
</script>

<style scoped lang="sass">
svg.svg--SideNavListLink
  width: 2em

.global-side-nav
  z-index: 90

.backdrop
  position: fixed
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  background-color: rgba(0, 0, 0, 0.1)
  z-index: 90

.inner
  position: fixed
  top: 0
  left: 0
  width: 240px
  max-width: 80vw
  padding-top: 50px
  height: 100vh
  background-color: #fff
  z-index: 95
  transition: all 0.5s

.side-nav-toggle
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
  height: 50px
  padding: 0.4rem
  display: flex
  align-items: center

.siteLogo
  height: 2.2rem

// Hidden state
.hidden
  .inner
    left: -300px
  .backdrop
    display: none

.search-area
  display: block
  padding: 0 1.6rem
  .search-box
    box-shadow: 0 0 8px #ddd
    border-radius: 2em

@media screen and (min-width: 450px)
  .search-area
    display: none !important
</style>
