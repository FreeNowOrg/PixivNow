<template lang="pug">
#home-view
  .top-slider.align-center(
    :style='{ "background-image": `url(${randomBg.urls?.regular || randomBg.url || ""})` }'
  )
    section.search-area.flex-1
      SearchBox.big.search

    .site-logo
      img(:src='LogoH')
    .description Now, everyone can enjoy Pixiv

    .bg-info
      a.pointer(@click='async () => await setRandomBgNoCache()' title='换一个~')
        IFasRandom
      a.pointer(
        @click='isShowBgInfo = true'
        style='margin-left: 0.5em'
        title='关于背景'
        v-if='randomBg.id'
      )
        IFasInfoCircle

  NModal(
    :title='`背景图片：${randomBg.alt}`'
    closable
    preset='card'
    v-model:show='isShowBgInfo'
  )
    .bg-info-modal
      .align-center
        RouterLink.thumb(:to='"/artworks/" + randomBg.id')
          img(:src='randomBg.urls?.regular || randomBg.url' lazyload)
        .desc
          .author
            RouterLink(:to='"/users/" + randomBg.userId') {{ randomBg.userName }}
            | 的作品 (ID: {{ randomBg.id }})
        NSpace(justify='center' size='small' style='margin-top: 1rem')
          NTag(
            :key='tag'
            @click='$router.push({ name: "search", params: { keyword: tag, p: 1 } })'
            style='cursor: pointer'
            v-for='tag in randomBg.tags'
          ) {{ tag }}

  .body-inner
    section.discover
      NH2 探索发现
      .align-center
        NButton(
          :loading='loadingDiscovery'
          @click='discoveryList.length ? (async () => await setDiscoveryNoCache())() : void 0'
          round
          secondary
          size='small'
        )
          template(#default) {{ loadingDiscovery ? '加载中' : '换一批' }}
          template(#icon): NIcon: IFasRandom
      ArtworkList(:list='discoveryList', :loading='loadingDiscovery')
</template>

<script lang="ts" setup>
import ArtworkList from '@/components/ArtworksList/ArtworkList.vue'
import SearchBox from '@/components/SearchBox.vue'
import { NH2, NButton, NIcon, NModal } from 'naive-ui'
import IFasInfoCircle from '~icons/fa-solid/info-circle'
import IFasRandom from '~icons/fa-solid/random'

import { formatInTimeZone } from 'date-fns-tz'
import { getCache, setCache } from './siteCache'
import { defaultArtwork, isArtwork } from '@/utils'
import { ajax } from '@/utils/ajax'

import LogoH from '@/assets/LogoH.png'
import type { Artwork, ArtworkInfo, ArtworkInfoOrAd } from '@/types'
import { setTitle } from '@/utils/setTitle'

const isShowBgInfo = ref(false)
const discoveryList = ref<ArtworkInfo[]>([])
const randomBg = ref<Artwork>({ ...defaultArtwork, urls: {} } as any)

async function setRandomBgNoCache(): Promise<void> {
  try {
    const { data } = await ajax.get<Artwork[]>('/api/random', {
      params: {
        max: '1',
      },
    })
    const info = data[0]
    randomBg.value = info
    setCache('home.randomBg', info)
  } catch (err) {
    console.error(err)
  }
}

async function setRandomBgFromCache(): Promise<void> {
  const cache = getCache('home.randomBg')
  if (cache) {
    randomBg.value = cache
  } else {
    await setRandomBgNoCache()
  }
}

const loadingDiscovery = ref(false)
async function setDiscoveryNoCache(): Promise<void> {
  if (loadingDiscovery.value) return
  try {
    loadingDiscovery.value = true
    // discoveryList.value = []
    const { data } = await ajax.get<{ illusts: ArtworkInfoOrAd[] }>(
      '/ajax/illust/discovery',
      { params: new URLSearchParams({ mode: 'all', max: '8' }) }
    )
    console.info('setDiscoveryNoCache', data)
    const illusts = data.illusts.filter((item): item is ArtworkInfo =>
      isArtwork(item)
    )
    discoveryList.value = illusts
    setCache('home.discoveryList', illusts)
  } catch (err) {
    console.error('获取探索发现失败', err)
  } finally {
    loadingDiscovery.value = false
  }
}

async function setDiscoveryFromCache(): Promise<void> {
  const cache = getCache('home.discoveryList')
  if (cache) {
    discoveryList.value = cache
    loadingDiscovery.value = false
  } else {
    await setDiscoveryNoCache()
  }
}

onMounted(async () => {
  setTitle()
  setRandomBgFromCache()
  setDiscoveryFromCache()
})
</script>

<style lang="sass">

[data-route="home"]
  .top-slider
    min-height: calc(100vh)
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

    .bg-info
      position: absolute
      right: 1.5rem
      bottom: 1rem
      font-size: 1.25rem

      a
        --color: #fff

  .site-logo
    img
      height: 4rem
      width: auto

  .description
    font-size: 1.2rem

  .search-area
    display: flex
    align-items: center

    > *
      width: 100%

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
