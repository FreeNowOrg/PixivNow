<template lang="pug">
header.global-navbar(:class='{ "not-at-top": notAtTop, hidden, "side-nav-opened": sideNavStore.isOpened }')
  .flex
    button.side-nav-toggle.plain(
      aria-label='打开导航菜单'
      title='导航菜单'
      @click='toggleSideNav'
      :class='{ "is-active": sideNavStore.isOpened }'
    )
      IFasBars(aria-hidden='true')

    .logo-area
      RouterLink.plain(to='/')
        img.site-logo(:src='SiteLogo')

    .flex.search-area(v-if='$route.name !== "search"')
      .search-full.align-right.flex-1
        .header-search
          FnbSelect.search-scope(
            v-if='wide',
            :model-value='searchType',
            :options='contentOptions',
            @update:model-value='searchType = $event'
          )
          SearchBox(:type='effectiveType', :no-icon='wide')
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
            :src='userStore.isLoggedIn ? userStore.userProfileImg : noProfileImg'
          )

        .dropdown-content(:class='{ visible: showUserDropdown }')
          ul
              //- notLogIn
              li(v-if='!userStore.isLoggedIn')
                .nav-user-card
                  .top
                    .banner-bg
                    img.avatar(:src='noProfileImg')
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
              li.theme-row
                span.theme-row__label 主题
                ThemeToggle
              li(v-if='userStore.isLoggedIn')
                a.plain(@click='logoutUser') 用户登出
</template>

<script lang="ts" setup>
import SearchBox from './SearchBox.vue'
import { contentOptions } from '~/utils/searchOptions'
import IFasBars from '~icons/fa-solid/bars'
import IFasSearch from '~icons/fa-solid/search'
import { logout } from '~/composables/userData'
import SiteLogo from '~/assets/PixivNow.svg'
import { useSideNavStore, useUserStore } from '~/stores/session'
import { pximgS } from '~/utils/pximg'

const noProfileImg = pximgS('common/images/no_profile.png')

const hidden = ref(false)
const notAtTop = ref(false)
const showUserDropdown = ref(false)
const userLinkRef = ref<HTMLElement | null>(null)
const sideNavStore = useSideNavStore()
const userStore = useUserStore()

const searchType = ref('artworks')
const wide = useMediaQuery('(min-width: 768px)')
const effectiveType = computed(() => (wide.value ? searchType.value : 'artworks'))

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
  if (logout()) {
    userStore.logout()
  }
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

<style lang="scss">

.global-navbar {
  background-color: var(--fnb-brand);
  padding: 0.4rem 1rem;
  color: var(--fnb-on-brand);
  display: flex;
  align-items: center;
  position: sticky;
  height: 60px;
  width: 100%;
  box-sizing: border-box;
  white-space: nowrap;
  top: 0;
  z-index: 100;
  transition: all 0.8s ease;
  border-bottom: 3px solid var(--fnb-border);

  .flex {
    display: flex;
    width: 100%;
    gap: 1rem;
    align-items: center;
  }

  .side-nav-toggle {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 1.2rem;
    text-align: center;
    color: var(--fnb-on-brand);
    cursor: pointer;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: var(--fnb-radius);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover, &.is-active {
      background-color: var(--fnb-highlight);
      color: var(--fnb-on-light);
    }

    &:focus-visible {
      outline: 2px solid var(--fnb-on-brand);
      outline-offset: 2px;
    }
  }

  .logo-area {
    a {
      display: block;
      line-height: 0;
    }
    .site-logo {
      height: 2.6rem;
      width: auto;
    }
  }

  .search-area {
    flex: 1;
  }

  // Scope selector + search input merged into one pill
  .header-search {
    display: flex;
    align-items: stretch;
    width: 100%;
    background: var(--fnb-surface);
    @include fnb-border-sm;
    @include fnb-shadow-sm;
    border-radius: var(--fnb-radius-sm);
    // header sets color:#fff and .align-right — reset inside the pill
    color: var(--fnb-text);
    text-align: left;

    .search-scope {
      min-width: auto;
      flex-shrink: 0;
    }

    .fnb-select-trigger {
      border: none;
      box-shadow: none;
      border-right: 2px solid var(--fnb-border);
      border-radius: var(--fnb-radius-sm) 0 0 var(--fnb-radius-sm);
      background: transparent;
      height: 100%;

      &:hover {
        transform: none;
        background: var(--fnb-highlight);
        color: var(--fnb-on-light);
      }
    }

    .search-box {
      flex: 1;

      input {
        border: none;
        box-shadow: none;
        background: transparent;
        color: var(--fnb-text);
        text-align: left;
      }
    }
  }

  .user-area {
    .avatar {
      height: 2rem;
      width: 2rem;
      @include fnb-border-sm;
    }

    .user-link {
      position: relative;

      .dropdown-btn {
        border: none;
        background: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;

        &:focus-visible {
          outline: 2px solid var(--fnb-on-brand);
          outline-offset: 2px;
        }

        .avatar {
          box-shadow: 0 0 0 2px var(--fnb-on-brand);
          transition: box-shadow 0.24s ease;
        }

        &.show-user {
          .avatar {
            box-shadow: 0 0 0 2px var(--fnb-highlight);
          }
        }
      }

      .dropdown-content {
        position: absolute;
        top: 1.4rem;
        right: 0;
        padding: 0;
        padding-top: 0.4rem;
        width: 200px;
        opacity: 0;
        transform: translateY(-0.5rem);
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;

        &.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        ul {
          list-style: none;
          padding: 4px;
          background-color: var(--fnb-surface);
          @include fnb-border;
          @include fnb-shadow;

          li > * {
            padding: 0.5rem;
          }

          li a {
            display: block;
            cursor: pointer;

            &:hover {
              background-color: var(--fnb-highlight);
              color: var(--fnb-on-light);
            }
          }
        }
      }
    }
  }

  .nav-user-card {
    border-bottom: 1px solid var(--fnb-border);
    position: relative;

    .top {
      position: relative;

      .banner-bg {
        position: absolute;
        top: calc(-0.4rem - 6px);
        left: -12px;
        height: 56px;
        width: calc(100% + 24px);
        background-color: color-mix(in srgb, var(--fnb-brand) 10%, transparent);
        z-index: 0;
      }

      a {
        display: inline !important;
        position: relative;
        z-index: 1;
      }
    }

    .avatar {
      width: 68px;
      height: 68px;
    }

    .details {
      .user-name {
        font-size: 1rem;
      }

      .uid {
        font-size: 0.8rem;
        color: var(--fnb-text-muted);
      }
    }
  }

  .theme-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .theme-row__label {
    font-weight: 700;
  }

  .search-icon {
    display: none;

    button {
      border: none;
      background: none;
      padding: 0;
      font: inherit;
      color: var(--fnb-on-brand);
      cursor: pointer;

      &:focus-visible {
        outline: 2px solid var(--fnb-on-brand);
        outline-offset: 2px;
      }
    }
  }
}

// Home page: transparent navbar, search hidden until scrolled
[data-route="home"] {
  .global-navbar {
    background: none;
    border-bottom-color: transparent;

    .search-area {
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }

    &.not-at-top, &.side-nav-opened {
      background-color: var(--fnb-brand);
      border-bottom-color: var(--fnb-border);

      .search-area {
        opacity: 1;
        pointer-events: all;
      }
    }
  }
}

@media (max-width: 450px) {
  .global-navbar {
    .search-full {
      display: none;
    }

    .search-icon {
      display: block;
    }
  }
}
</style>
