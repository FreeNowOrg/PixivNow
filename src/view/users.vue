<template lang="pug">

//- Loading
section.loading(v-if="loading")
  h1 {{ loading ? '正在读取用户 #' + $route.params.id : '“' + user.name + '”的空间' }}
  placeholder

//- Error
section.error(v-if="error")
  error-page(title="出大问题" :description="error")

//- :)
section.user(v-if="!loading && !error")
  .userInfo
    .bgArea
      .bgContainer(:style="{backgroundImage: 'url(' + API + user.background.url + ')'}")
        span(v-if="!user.background") 用户未设置封面~
    .avatarArea
      a(:href="API + user.imageBig")
        img(:src="API + user.imageBig")
    .infoArea
      .username {{ user.name }}
      .following
        strong {{ user.following }}
        | 
        | 已关注
      .gender {{ user.gender.name }}
      .birthday {{ user.birthDay.name }}
      .region {{ user.region.name }}
      .webpage(v-if="user.webpage")
        a(:href="user.webpage" target="_blank") {{ user.webpage }}
      .comment {{ user.comment }}
      .more
        a(@click="userMore") 查看更多
  
  .userArtworks
    h2 插画
    artworks-list(:list="user.illusts")
    h2 漫画
    artworks-list(:list="user.manga")

</template>

<script lang="ts">
import axios from 'axios'
import { useRoute } from 'vue-router'
const API = 'https://pixiv.js.org'

import ArtworksList from '../components/ArtworksList/ArtworksList.vue'
import ErrorPage from '../components/ErrorPage.vue'
import Placeholder from '../components/Placeholder.vue'

export default {
  components: {
    ArtworksList,
    ErrorPage,
    Placeholder,
  },
  data() {
    return {
      API,
      loading: true,
      listLoading: true,
      error: '',
      user: {},
    }
  },
  methods: {
    init() {
      this.loading = true
      axios
        .get(`${API}/api/user/${this.$route.params.id}`, {
          params: { lang: 'zh' },
        })
        .then(
          ({ data }) => {
            this.user = data
            document.title = `${data.name} | User | PixivNow`
          },
          (err) => {
            console.warn('user', err.response)
            this.error = err.message
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
    userMore() {
      alert(JSON.stringify(this.user, null, 2))
    },
  },
  mounted() {
    document.title = `User | PixivNow`
    this.init()
  },
}
</script>

<style scoped lang="sass">
.loading
  text-align: center

.userInfo
  position: relative
  margin: -1rem -1rem 1rem -1rem
  // box-shadow: 0 4px 16px var(--theme-box-shadow-color)

  .bgArea
    .bgContainer
      position: relative
      width: 100%
      height: 260px
      background-color: #efefef
      background-position: center
      background-repeat: no-repeat
      background-size: 100%

      > span
        user-select: none
        color: #ccc
        display: inline-block
        position: absolute
        left: 50%
        top: 50%
        transform: translateX(-50%) translateY(-50%)

  .infoArea
    padding-left: calc(2rem + 80px + 2rem)
    padding-top: 1rem

    > div
      margin: 0.4rem auto

    .username
      font-size: 1.4rem
      font-weight: 600

  .avatarArea
    position: absolute
    top: 220px
    left: 2rem
    // left: 50%
    // transform: translateX(-50%)

    img
      width: 80px
      height: auto
      border-radius: 50%
      box-shadow: 0 0 0 6px #fff
</style>
