<template lang="pug">
.topSlider.align-center(:style="{ 'background-image': `url(${randomBg.url})` }")

  section.searchArea.flex-1
    search-box.big.search

  .siteLogo
    img(:src="LogoH")
  .description Pixiv Service Proxy

  .bgInfo
    a.pointer(
      style="margin-right: 0.5em"
      title="换一个~"
      @click="setRandomBg(true)"
    )
      fa(icon="random")
    a.pointer(
      v-if="randomBg.info.id"
      title="关于背景"
      @click="showBgInfo = true"
    )
      fa(icon="question-circle")

modal.bgInfoModal(v-model:show="showBgInfo")
  h3 背景图片：{{ randomBg.info.title }}
  .align-center
    router-link.thumb(:to="'/artworks/' + randomBg.info.id")
      lazyload(:src="randomBg.url")
    .desc
      strong {{ randomBg.info.title }}
      | &nbsp;-&nbsp;
      router-link(:to="'/users/' + randomBg.info.userId") {{ randomBg.info.userName }}
      | 的作品 (ID: {{ randomBg.info.id }})

section.discover
  h2 探索发现
  .align-center(v-if="!discoverList.length")
    placeholder
  ArtworksMiniList(:list="discoverList")
  .align-center
    a.button(
      @click="setDiscovered(true)"
      v-if="discoverList.length")
      | 换一批&nbsp;
      fa(icon="random")

//- section.ranking
//-   h2 今日排行
//-   .align-center(v-if="rankList.length < 1")
//-     placeholder
//-   ArtworksList(:list="rankList")

</template>

<script lang="ts">
import axios from 'axios'
import { API_BASE } from '../config'
import { getCache, setCache } from './siteCache'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ArtworksMiniList from '../components/ArtworksList/ArtworksMiniList.vue'
import Modal from '../components/Modal.vue'
import SearchBox from '../components/SearchBox.vue'
import Placeholder from '../components/Placeholder.vue'
import LogoH from '../assets/LogoH.png'

import { Artwork } from '../types'

export default {
  components: {
    ArtworksList,
    ArtworksMiniList,
    Modal,
    SearchBox,
    Placeholder,
  },
  data() {
    return {
      rankList: [],
      discoverList: [],
      LogoH,
      showBgInfo: false,
      randomBg: {
        url:
          // 钟离我的钟离呜呜呜呜呜钟离！！！！！
          // 'https://blog.wjghj.cn/_statics/images/background/2021BeneathTheLightOfJadeite/bg.jpg',
          // 这个里面可能有色图
          //     `https://cdn.jsdelivr.net/gh/Moe-Dog/Moe-Dog.github.io@0.4/statics/img/${parseInt(
          //       '' + Math.random() * 20 + 1
          //     )}.jpg`,
          // 'https://api.daihan.top/api/acg',
          '',
        info: {} as Artwork,
      },
    }
  },
  methods: {
    initRank() {
      if (getCache('home.rankList')) {
        this.rankList = getCache('home.rankList')
        return
      }
      axios.get(`${API_BASE}/api/ranking`).then(({ data }) => {
        this.rankList = data.contents
        setCache('home.rankList', data.contents)
      })
    },
    setRandomBg(noCache?: boolean) {
      if (!noCache && getCache('home.randomBg')) {
        this.randomBg = getCache('home.randomBg')
        return
      }
      axios.get(`${API_BASE}/api/illust/random?max=1`).then(({ data }) => {
        const info = data[0]
        if (!info) {
          this.randomBg.url = 'https://api.daihan.top/api/acg'
          this.randomBg.info = {} as Artwork
          return
        }
        const url =
          API_BASE +
          info.url.replace(/\/c\/.+?\//, '/').replace('square', 'master')
        this.randomBg.info = info
        this.randomBg.url = url
        setCache('home.randomBg', { info, url })
      })
    },
    setDiscovered(noCache?: boolean) {
      if (!noCache && getCache('home.discoverList')) {
        this.discoverList = getCache('home.discoverList')
        return
      }
      this.discoverList = []
      axios
        .get(`${API_BASE}/api/illust/random?max=8&mode=all`)
        .then(({ data }) => {
          this.discoverList = data
          setCache('home.discoverList', data)
        })
    },
  },
  mounted() {
    document.title = 'PixivNow'

    // this.initRank()
    this.setRandomBg()
    this.setDiscovered()
  },
}
</script>

<style lang="sass">
[data-route="home"]
  .topSlider
    min-height: calc(100vh)
    margin-left: -1rem
    margin-right: -1rem
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

    .bgInfo
      position: absolute
      right: 1.5rem
      bottom: 1rem

      a
        --color: #fff

  .siteLogo
    img
      height: 4rem
      width: auto

  .description
    font-size: 1.2rem

  .searchArea
    display: flex
    align-items: center

    > *
      width: 100%

  .globalNavbar
    background: none
    .searchArea
      opacity: 0
      transition: opacity 0.4s ease
      pointer-events: none

    &.notAtTop
      background-color: var(--theme-accent-color)
      .searchArea
        opacity: 1
        pointer-events: all
  .bgInfoModal
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
