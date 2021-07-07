<template lang="pug">
h1 排行榜

//- Error
section(v-if="error && !loading")
  error-page(title="出大问题", :description="error")

//- Result
section(v-if="!error")
  artworks-list(:list="list")
</template>

<script lang="ts">
import axios from 'axios'
// import { router } from '../router'
import { API_BASE } from '../config'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'

export default {
  components: {
    ArtworksList,
    ErrorPage,
    Placeholder,
  },
  methods: {
    init() {
      this.loading = true
      axios
        .get(`${API_BASE}/api/ranking`)
        .then(
          ({ data }) => {
            this.list = data
          },
          (err) => {
            const code = err?.response?.data?.status
            const message =
              code === 400
                ? '您需要配置密钥以查看排行榜。'
                : err?.response?.data?.message || err.message
            this.error = message
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
  },
  mounted() {
    this.init()
  },
  data() {
    return {
      loading: true,
      error: '',
      list: {},
    }
  },
}
</script>

<style scoped lang="stylus"></style>
