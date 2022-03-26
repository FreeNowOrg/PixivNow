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
        style='margin-right: 0.5em',
        title='换一个~',
        @click='setRandomBg(true)'
      )
        fa(icon='random')
      a.pointer(
        v-if='randomBg.info.id',
        title='关于背景',
        @click='showBgInfo = true'
      )
        fa(icon='question-circle')

  modal.bg-info-modal(v-model:show='showBgInfo')
    h3 背景图片：{{ randomBg.info.title }}
    .align-center
      router-link.thumb(:to='"/artworks/" + randomBg.info.id')
        img(:src='randomBg.url' lazyload)
      .desc
        strong {{ randomBg.info.title }}
        | &nbsp;-&nbsp;
        router-link(:to='"/users/" + randomBg.info.userId') {{ randomBg.info.userName }}
        | 的作品 (ID: {{ randomBg.info.id }})

  .body-inner
    section.discover
      h2 探索发现
      .align-center
        a.button(@click='discoverList.length ? setDiscovered() : void 0')
          | {{ discoverList.length ? "换一批" : "加载中" }}
          |
          fa(
            :icon='discoverList.length ? "random" : "spinner"',
            :spin='!discoverList.length'
          )
      .align-center(v-if='!discoverList.length')
        placeholder
      artworks-list(:list='discoverList')
</template>

<script lang="ts" setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { formatInTimeZone } from 'date-fns-tz'
import { API_BASE } from '../config'
import { getCache, setCache } from './siteCache'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import Modal from '../components/Modal.vue'
import SearchBox from '../components/SearchBox.vue'
import Placeholder from '../components/Placeholder.vue'
import LogoH from '../assets/LogoH.png'
import type { ArtworkReduced } from '../types'

const showBgInfo = ref(false)
const discoverList = ref([])
const randomBg = ref<{
  url: string
  info: ArtworkReduced
}>({
  url: '',
  info: {} as ArtworkReduced,
})

async function setRandomBg(noCache?: boolean): Promise<void> {
  if (!noCache && getCache('home.randomBg')) {
    randomBg.value = getCache('home.randomBg')
    return
  }
  try {
    const { data }: { data: { illusts: ArtworkReduced[] } } = await axios.get(
      `${API_BASE}/ajax/illust/discovery`,
      {
        params: {
          mode: 'safe',
          max: 1,
        },
      }
    )
    const info = data.illusts.find((item) => item.id) as ArtworkReduced
    const middle = `img/${formatInTimeZone(
      info.updateDate,
      'Asia/Tokyo',
      'yyyy/MM/dd/HH/mm/ss'
    )}/${info.id}`
    const url = `${API_BASE}/-/img-master/${middle}_p0_master1200.jpg`
    randomBg.value.info = info
    randomBg.value.url = url
    setCache('home.randomBg', { info, url })
  } catch (err) {
    randomBg.value.url = 'https://api.daihan.top/api/acg'
  }
}

async function setDiscovered(): Promise<void> {
  discoverList.value = getCache('home.discoverList') || []
  if (discoverList.value.length) return
  try {
    const { data } = await axios.get(`${API_BASE}/ajax/illust/discovery`, {
      params: {
        mode: 'all',
        max: 8,
      },
    })
    discoverList.value = data.illusts
    setCache('home.discoverList', data.illusts)
  } catch (err) {
    console.error('获取探索发现失败')
  }
}

onMounted(async () => {
  document.title = 'Pixiv Now'
  await setRandomBg()
  await setDiscovered()
})
</script>

<style lang="sass">

[data-route="home"]
  .top-slider
    min-height: calc(100vh)
    margin-top: calc(-50px - 1rem)
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
