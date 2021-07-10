<template lang="pug">
h1(v-if="!list") 排行榜正在加载……
h1(v-if="list") 排行榜 ({{ list.date.getFullYear() }}年{{ list.date.getMonth() + 1 }}月{{ list.date.getDate() }}日 第{{ list.page }}页)

//- Error
section(v-if="error && !loading")
  error-page(title="出大问题", :description="error")

//- Loading
section.loading(v-if="loading")
  placeholder

//- Result
section(v-if="!error")
  artworks-list(:list="list.content")

</template>

<script lang="ts">
import axios from 'axios'
// import { router } from '../router'
import { userData } from '../components/userLogin'
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
      this.list = null

      const { p, mode, date } = this.$route.params
      axios
        .get(`${API_BASE}/api/ranking`, {
          params: {
            p,
            mode,
            date,
          },
        })
        .then(
          ({ data }) => {
            // Date
            let date: string = data.date
            date =
              date.substr(0, 4) +
              '-' +
              date.substr(4, 2) +
              '-' +
              date.substr(6, 2)
            data.date = new Date(date)

            this.list = data
          },
          (err) => {
            this.error =
              err?.response?.data?.error || err.message || '出现未知问题'
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
      list: null,
      userData,
    }
  },
}
</script>

<style scoped lang="stylus"></style>
