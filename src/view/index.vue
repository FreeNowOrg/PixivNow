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
        a.button(@click='discoverList.length ? setDiscovered(true) : void 0')
          | {{ discoverList.length ? "换一批" : "加载中" }}
          |
          fa(
            :icon='discoverList.length ? "random" : "spinner"',
            :spin='!discoverList.length'
          )
      .align-center(v-if='!discoverList.length')
        placeholder
      artworks-list(:list='discoverList')

    //- section.ranking
    //-   h2 今日排行
    //-   .align-center(v-if="rankList.length < 1")
    //-     placeholder
    //-   ArtworksList(:list="rankList")
</template>

<script lang="ts" setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { API_BASE } from '../config'
import { getCache, setCache } from './siteCache'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import Modal from '../components/Modal.vue'
import SearchBox from '../components/SearchBox.vue'
import Placeholder from '../components/Placeholder.vue'
import LogoH from '../assets/LogoH.png'

const showBgInfo = ref(false)
const discoverList = ref([])
const rankList = ref([])
const randomBg = ref<{
  url: string
  info: any
}>({
  url: '',
  info: {} as any
})

function initRank(): void {
  if (getCache('home.rankList')) {
    rankList.value = getCache('home.rankList')
    return
  }
  axios.get(`${API_BASE}/api/ranking`).then(({ data }) => {
    rankList.value = data.contents
    setCache('home.rankList', data.contents)
  })
}

function setRandomBg(noCache?: boolean): void {
  if (!noCache && getCache('home.randomBg')) {
    randomBg.value = getCache('home.randomBg')
    return
  }
  axios.get(`${API_BASE}/api/illust/random?max=1`).then(({ data }) => {
    const info = data[0]
    if (!info) {
      randomBg.value.url = 'https://api.daihan.top/api/acg'
      randomBg.value.info = {} as any
      return
    }
    const url = API_BASE + info.urls.regular
    randomBg.value.info = info
    randomBg.value.url = url
    setCache('home.randomBg', { info, url })
  })
}

function setDiscovered(noCache?: boolean): void {
  if (!noCache && getCache('home.discoverList')) {
    discoverList.value = getCache('home.discoverList')
    return
  }
  discoverList.value = []
  axios
    .get(`${API_BASE}/api/illust/random?max=8&mode=all`)
    .then(({ data }) => {
      discoverList.value = data
      setCache('home.discoverList', data)
    })
}

onMounted(() => {
  document.title = 'Pixiv Now'
  setRandomBg()
  initRank()
  setDiscovered(true)
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
