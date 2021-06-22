<template lang="pug">
mixin pagenator()
  .pagenator(v-if="resultList.length >= 60")
    button.prev(v-if="p === 1" disabled) 上一页
    button.prev(v-if="p !== 1" @click="prevPage") 上一页
    span.page {{ p }}
    button.next(@click="nextPage") 下一页


h1 搜索“{{ keyword }}”相关的作品 (第{{ p }}页)

search-box.big(:style="{marginBottom: '1.2rem'}")

//- Error
section(v-if="error && !loading")
  error-page(title="出大问题", :description="error")

//- Result
section(v-if="!error")
  +pagenator()

  //- Loading
  .loadingArea(v-if="loading")
    div(style={'text-align': 'center'})
      placeholder

  .resultArea(v-if="!loading")
    artworks-list(:list="resultList")

  .noMore(v-if="!loading && resultList.length < 60") 没有了，一滴都没有了……

  +pagenator()
</template>

<script lang="ts">
import axios from 'axios'
import { router } from '../router'
import { API_BASE } from '../config'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'
import SearchBox from '../components/SearchBox.vue'

export default {
  components: {
    ArtworksList,
    ErrorPage,
    Placeholder,
    SearchBox,
  },
  methods: {
    makeSearch() {
      this.loading = true

      this.keyword = this.$route.params.keyword as string
      this.p = parseInt(this.$route.params.p as string)

      if (!this.keyword) return

      document.title = `${this.keyword} (第${this.p}页) | Search | PixivNow`

      axios
        .get(`${API_BASE}/api/search/${encodeURIComponent(this.keyword)}`, {
          params: {
            p: this.p || 1,
            mode: this.$route.query.mode || 'safe',
          },
        })
        .then(
          ({ data }) => {
            this.resultList = data?.illustManga?.data || []
            console.info(data?.illustManga?.data)
          },
          (err) => {
            this.error = err?.response?.data?.message || err.message || 'HTTP 请求超时'
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
    prevPage() {
      this.p--
    },
    nextPage() {
      this.p++
    },
  },
  data() {
    return {
      keyword: '',
      p: 1,
      loading: true,
      error: '',
      resultList: [],
    }
  },
  watch: {
    p(val) {
      val = parseInt(val)
      if (isNaN(val) || val < 1) this.p = 1
      router.push(
        `/search/${this.keyword}/${this.p}${
          this.$route.query.mode ? '?mode=' + this.$route.query.mode : ''
        }`
      )
    },
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => this.$route.params.keyword && this.makeSearch()
    )
  },
  // beforeRouteUpdate(to, from) {
  //   console.info('router', { to, from })
  //   this.makeSearch()
  // },
  mounted() {
    this.makeSearch()
  },
}
</script>

<style lang="sass" scoped>
.pagenator
  text-align: center

  .page
    display: inline-block
    text-align: center
    width: 3rem

.noMore
  text-align: center
  padding: 1rem
  border-radius: 4px
  box-shadow: 0 0 4px #aaaaaa
</style>
