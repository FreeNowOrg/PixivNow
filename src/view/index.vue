<template lang="pug">
.home
  .title
    span PixivNow
  p.description Pixiv Service Proxy

section.search
  h2 探索发现
  search-box.big.search

section.ranking
  h2 今日排行
  .loading(v-if="rankList.length < 1")
    placeholder
  artworks-list.inline(:list="rankList")

</template>

<script lang="ts">
import axios from 'axios'
import { API_BASE } from '../config'
import { getCache, setCache } from './siteCache'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import SearchBox from '../components/SearchBox.vue'
import Placeholder from '../components/Placeholder.vue'

export default {
  components: {
    ArtworksList,
    SearchBox,
    Placeholder,
  },
  data() {
    return {
      rankList: [],
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
.home
  margin: 4rem auto 2rem auto
  height: 100%
  text-align: center

.description
  font-size: 1.2rem

.title
  font-size: 6rem
  font-weight: bold
  user-select: none

  > span
    box-shadow: 0 -0.5em 0 var(--theme-accent-color) inset
    text-shadow: 2px 2px var(--theme-text-shadow-color)
    padding: 0 0.4em

.search
  margin: 1rem 0

.loading
  text-align: center
</style>
