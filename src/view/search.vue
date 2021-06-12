<template lang="pug">
h1 搜索“{{ keyword }}”相关的插画
//- Loading
section(v-if="loading")
  div(style={'text-align': 'center'})
    placeholder
  
//- Error
section(v-if="error && !loading")
  error-page(title="出大问题", :description="error")

//- Result
section(v-if="!error && !loading")
  .resultArea
    artworks-list(:list="resultList")
</template>

<script lang="ts">
import axios from 'axios'
import ErrorPage from '../components/ErrorPage.vue'
import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import Placeholder from '../components/Placeholder.vue'

export default {
  components: {
    ArtworksList,
    ErrorPage,
    Placeholder,
  },
  methods: {
    makeSearch() {
      this.loading = true
      this.keyword = this.$route.params.keyword as string
      document.title = `搜索“${this.keyword}” | PixivNow`
      axios
        .get(`https://pixiv.js.org/api/search/${encodeURI(this.keyword)}`)
        .then(
          ({ data }) => {
            this.resultList = data?.illustManga?.data || []
            console.info(data?.illustManga?.data)
          },
          (err) => {
            this.error = err.message
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
  },
  data() {
    return {
      keyword: '',
      loading: true,
      page: 0,
      error: '',
      resultList: [],
    }
  },
  watch: {
    keyword(val) {
      console.log(val)
    },
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => this.makeSearch()
    )
  },
  // beforeRouteEnter(to, from) {
  //   console.info('router', { to, from })
  // },
  mounted() {
    this.makeSearch()
  },
}
</script>

<style lang="sass" scoped>
pre
  overflow: auto
  background-color: #efefef
  max-height: 70vh
</style>
