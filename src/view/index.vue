<template lang="pug">
.topSlider.align-center(:style="{ 'background-image': `url(${backgroundImage})` }")

  section.searchArea.flex-1
    search-box.big.search

  .siteLogo
    img(:src="LogoH")
  .description Pixiv Service Proxy

  .bgInfo
    a(href="javascript:;") 查看背景

section.ranking
  h2 今日排行
  .loading(v-if="rankList.length < 1")
    placeholder
  ArtworksList(:list="rankList")

</template>

<script lang="ts">
import axios from 'axios'
import { API_BASE } from '../config'
import { getCache, setCache } from './siteCache'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ArtworksMiniList from '../components/ArtworksList/ArtworksMiniList.vue'
import SearchBox from '../components/SearchBox.vue'
import Placeholder from '../components/Placeholder.vue'

import LogoH from '../assets/LogoH.png'

export default {
  components: {
    ArtworksList,
    ArtworksMiniList,
    SearchBox,
    Placeholder,
  },
  data() {
    return {
      rankList: [],
      LogoH,
      backgroundImage:
        'https://blog.wjghj.cn/_statics/images/background/2021BeneathTheLightOfJadeite/bg.jpg',
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
  },
  mounted() {
    document.title = 'PixivNow'

    this.initRank()
  },
}
</script>

<style scoped lang="sass">
.topSlider
  min-height: calc(100vh - 50px)
  margin: -1rem
  margin-bottom: 1rem
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

.loading
  text-align: center
</style>
