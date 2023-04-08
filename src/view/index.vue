<template lang="pug">
#home-view
  .top-slider.align-center(
    :style='{ "background-image": `url(${randomBg.url})` }'
  )
    section.search-area.flex-1
      search-box.big.search

    .site-logo
      img(:src='LogoH')
    .description Pixiv Service Proxy

    .bg-info
      a.pointer(
        @click='async () => await setRandomBgNoCache()'
        style='margin-right: 0.5em'
        title='换一个~'
      )
        i-fa-solid-random
      a.pointer(
        @click='showBgInfo = true'
        title='关于背景'
        v-if='randomBg.info.id'
      )
        i-fa-solid-question-circle

  modal.bg-info-modal(v-model:show='showBgInfo')
    h3 背景图片：{{ randomBg.info.title }}
    .align-center
      router-link.thumb(:to='"/artworks/" + randomBg.info.id')
        img(:src='randomBg.url' lazyload)
      .desc
        strong {{ randomBg.info.title }}
        | &ensp;&mdash;&ensp;
        router-link(:to='"/users/" + randomBg.info.userId') {{ randomBg.info.userName }}
        | 的作品 (ID: {{ randomBg.info.id }})

  .body-inner
    section.discover
      h2 探索发现
      .align-center
        a.button(
          @click='discoveryList.length ? (async () => await setDiscoveryNoCache())() : void 0'
        )
          | {{ discoveryList.length ? '换一批' : '加载中' }}
          |
          i-fa-solid-random(v-if='discoveryList.length')
          i-fa-solid-spinner.spin(v-else)
      .align-center(v-if='!discoveryList.length')
        placeholder
      artwork-list(:list='discoveryList')
</template>

<script lang="ts" setup>
import { formatInTimeZone } from 'date-fns-tz'
import { getCache, setCache } from './siteCache'
import { defaultArtwork, isArtwork } from '@/utils'
import { ajax } from '@/utils/ajax'

import LogoH from '@/assets/LogoH.png'
import type { ArtworkInfo, ArtworkInfoOrAd } from '@/types'

const showBgInfo = ref(false)
const discoveryList = ref<ArtworkInfo[]>([])
const randomBg = ref<{
  url: string
  info: ArtworkInfo
}>({
  url: '',
  info: {} as ArtworkInfo,
})

async function setRandomBgNoCache(): Promise<void> {
  try {
    const { data } = await ajax.get<{ illusts: ArtworkInfoOrAd[] }>(
      '/ajax/illust/discovery',
      { params: new URLSearchParams({ mode: 'safe', max: '1' }) }
    )
    const info =
      data.illusts.find((item): item is ArtworkInfo => isArtwork(item)) ??
      defaultArtwork
    const middle = `img/${formatInTimeZone(
      info.updateDate,
      'Asia/Tokyo',
      'yyyy/MM/dd/HH/mm/ss'
    )}/${info.id}`
    const url = `/-/img-master/${middle}_p0_master1200.jpg`
    randomBg.value.info = info
    randomBg.value.url = url
    setCache('home.randomBg', { info, url })
  } catch (err) {
    console.error(err)
    randomBg.value.url = 'https://api.daihan.top/api/acg'
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

async function setDiscoveryNoCache(): Promise<void> {
  try {
    discoveryList.value = []
    const { data } = await ajax.get<{ illusts: ArtworkInfoOrAd[] }>(
      '/ajax/illust/discovery',
      { params: new URLSearchParams({ mode: 'safe', max: '8' }) }
    )
    console.info('setDiscoveryNoCache', data)
    const illusts = data.illusts.filter((item): item is ArtworkInfo =>
      isArtwork(item)
    )
    discoveryList.value = illusts
    setCache('home.discoveryList', illusts)
  } catch (err) {
    console.error('获取探索发现失败', err)
  }
}

async function setDiscoveryFromCache(): Promise<void> {
  const cache = getCache('home.discoveryList')
  if (cache) {
    discoveryList.value = cache
  } else {
    await setDiscoveryNoCache()
  }
}

onMounted(async () => {
  document.title = 'Pixiv Now'
  await setRandomBgFromCache()
  await setDiscoveryFromCache()
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
    h3
      margin-top: 0
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
