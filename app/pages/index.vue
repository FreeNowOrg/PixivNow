<template lang="pug">
#home-view
  .top-slider.align-center(
    :style='{ "background-image": `url(${randomBgRegularUrl || ""})` }'
  )
    section.search-area.flex-1
      SearchBox.big.search

    .site-logo
      img(:src='LogoH')
    .description Now, everyone can enjoy Pixiv

    .bg-info
      a.pointer(@click='homeStore.fetchRandomBg()' title='换一个~')
        IFasRandom
      a.pointer(
        @click='isShowBgInfo = true'
        style='margin-left: 0.5em'
        title='关于背景'
        v-if='randomBg?.id'
      )
        IFasInfoCircle

  Teleport(to='body')
    Transition(name='dialog')
      .fnb-dialog-overlay(v-if='isShowBgInfo' @click.self='isShowBgInfo = false')
        .fnb-dialog-card
          button.fnb-dialog-card__close(@click='isShowBgInfo = false' aria-label='关闭') ×
          .fnb-dialog-card__header {{ `背景图片：${randomBg?.alt}` }}
          .fnb-dialog-card__body
            .bg-info-modal
              .align-center
                RouterLink.thumb(:to='"/artworks/" + randomBg?.id')
                  img(
                    :src='randomBgRegularUrl',
                    :style='{ width: "100%", height: "auto" }'
                    lazyload
                  )
                .desc
                  .author
                    RouterLink(:to='"/users/" + randomBg?.userId') @{{ randomBg?.userName }}
                    | 的作品 (ID: {{ randomBg?.id }})
                .tag-list(style='display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 1rem')
                  FnbTag(
                    :key='tag'
                    clickable
                    @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)'
                    v-for='tag in randomBg?.tags'
                  ) {{ tag }}

  .body-inner
    section.discover
      h2 探索发现
      .align-center
        FnbButton(
          :loading='homeStore.loadingDiscovery'
          @click='homeStore.discoveryList.length ? homeStore.fetchDiscovery() : void 0'
          size='sm'
        )
          template(#icon): IFasRandom
          template(#default) {{ homeStore.loadingDiscovery ? '加载中' : '换一批' }}
      ArtworkList(
        :list='homeStore.discoveryList',
        :loading='homeStore.loadingDiscovery'
      )
</template>

<script lang="ts" setup>
import ArtworkList from '~/components/Artwork/ArtworkList.vue'
import SearchBox from '~/components/SearchBox.vue'
import IFasInfoCircle from '~icons/fa-solid/info-circle'
import IFasRandom from '~icons/fa-solid/random'
import { useHomeStore } from '~/stores/home'
import { toRegularUrl } from '~/utils/pximg'
import LogoH from '~/assets/LogoH.png'
import { setTitle } from '~/utils/setTitle'

definePageMeta({ name: 'home' })

// Mark body with route class for navbar transparency
useHead({
  bodyAttrs: { 'data-route': 'home' },
})

const isShowBgInfo = ref(false)
useBodyScrollLock(isShowBgInfo)
const homeStore = useHomeStore()
const randomBg = computed(() => homeStore.randomBg)
const randomBgRegularUrl = computed(() => {
  const bg = randomBg.value
  if (!bg?.url) return ''
  return toRegularUrl(bg.url)
})

onMounted(async () => {
  setTitle()
  if (!homeStore.randomBg) {
    homeStore.fetchRandomBg()
  }
  if (!homeStore.discoveryList.length) {
    homeStore.fetchDiscovery()
  }
})
</script>

<style lang="scss">
#home-view {
  .top-slider {
    min-height: 100vh;
    margin-top: -63px;
    padding: 30px 10%;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
    position: relative;
    color: #fff;
    text-shadow: 0 0 2px #222;
    display: flex;
    flex-direction: column;

    &::before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      pointer-events: none;
      z-index: 0;
    }

    > * {
      position: relative;
      z-index: 1;
    }

    .search-area {
      display: flex;
      align-items: center;
      justify-content: center;

      > * {
        width: 100%;
      }
    }

    .site-logo {
      text-align: center;
      img {
        height: 4rem;
        width: auto;
      }
    }

    .description {
      font-size: 1.2rem;
      text-align: center;
    }

    .bg-info {
      position: absolute;
      right: 1.5rem;
      bottom: 1rem;
      font-size: 1.25rem;
      z-index: 1;

      a {
        --color: #fff;
      }
    }
  }

  .bg-info-modal {
    .thumb {
      > * {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 60vh;
        border-radius: var(--fnb-radius);
      }
    }
    .desc {
      margin-top: 1rem;
      font-size: 0.75rem;
      font-style: italic;
    }
  }
}

.fnb-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.fnb-dialog-card {
  @include fnb-border;
  @include fnb-shadow-lg;
  background: var(--fnb-surface);
  width: 600px;
  max-width: 86vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;

  &__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    font-weight: 900;
    line-height: 1;
    cursor: pointer;
    color: var(--fnb-text-muted);
    z-index: 1;

    &:hover {
      color: var(--fnb-text);
    }
  }

  &__header {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    font-size: 1.1rem;
    padding: 1rem 1.5rem 0.5rem;
    padding-right: 2.5rem;
  }

  &__body {
    padding: 0 1.5rem 1rem;
    overflow-y: auto;
    flex: 1;
  }
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
