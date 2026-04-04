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

  NModal(
    :title='`背景图片：${randomBg?.alt}`'
    closable
    preset='card'
    v-model:show='isShowBgInfo'
  )
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
        NSpace(justify='center' size='small' style='margin-top: 1rem')
          NTag(
            :key='tag'
            @click='$router.push(`/search/${encodeURIComponent(tag)}/1`)'
            style='cursor: pointer'
            v-for='tag in randomBg?.tags'
          ) {{ tag }}

  .body-inner
    section.discover
      NH2 探索发现
      .align-center
        NButton(
          :loading='homeStore.loadingDiscovery'
          @click='homeStore.discoveryList.length ? homeStore.fetchDiscovery() : void 0'
          round
          secondary
          size='small'
        )
          template(#default) {{ homeStore.loadingDiscovery ? '加载中' : '换一批' }}
          template(#icon): NIcon: IFasRandom
      ArtworkList(
        :list='homeStore.discoveryList',
        :loading='homeStore.loadingDiscovery'
      )
</template>

<script lang="ts" setup>
import IFasRandom from '~icons/fa-solid/random'
import LogoH from '~/assets/LogoH.png'

definePageMeta({ name: 'home' })

// Mark body with route class for navbar transparency
useHead({
  bodyAttrs: { 'data-route': 'home' },
})

const isShowBgInfo = ref(false)
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

<style lang="sass">
#home-view
  .top-slider
    min-height: 100vh
    margin-top: -50px
    padding: 30px 10%
    background-position: center
    background-repeat: no-repeat
    background-size: cover
    background-attachment: fixed
    position: relative
    color: #fff
    text-shadow: 0 0 2px #222
    display: flex
    flex-direction: column

    &::before
      content: ''
      display: block
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%
      background-color: rgba(0, 0, 0, 0.2)
      pointer-events: none
      z-index: 0

    > *
      position: relative
      z-index: 1

    .search-area
      display: flex
      align-items: center
      justify-content: center

      > *
        width: 100%

    .site-logo
      text-align: center
      img
        height: 4rem
        width: auto

    .description
      font-size: 1.2rem
      text-align: center

    .bg-info
      position: absolute
      right: 1.5rem
      bottom: 1rem
      font-size: 1.25rem
      z-index: 1

      a
        --color: #fff

  .bg-info-modal
    .thumb
      > *
        width: auto
        height: auto
        max-width: 100%
        max-height: 60vh
        border-radius: 8px
    .desc
      margin-top: 1rem
      font-size: 0.75rem
      font-style: italic
</style>
