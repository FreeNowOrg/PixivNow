<template>
  <div class="navbar">
    <router-link to="/artworks">← Back</router-link>
  </div>
  <h1>
    {{ loading ? 'Loading artwork #' + $route.params.id : illust.illustTitle }}
  </h1>
  <section class="loading" v-if="loading">
    <img src="https://blog.wjghj.cn/_statics/images/placeholder.svg" alt="" />
  </section>
  <section class="illust-container" v-if="!error && !loading">
    <gallery :pages="illust.pages" />
    <div class="">
      <h2>作者</h2>
      <author-card :user="user" />
    </div>
    <div class="description" v-if="illust.description">
      <h2>简介</h2>
      <p class="card" v-html="illust.description"></p>
    </div>
    <div class="more">
      <h2>原图</h2>
      <p class="card">
        <a
          :href="'https://www.pixiv.net/artworks/' + $route.params.id"
          target="_blank"
          rel="noopener noreferrer"
          >在 Pixiv 上查看</a
        >
      </p>
    </div>
  </section>
  <section class="error" v-if="error">
    <error-page title="出大问题" :description="'图片加载失败：' + error" />
  </section>
  <div class="navbar">
    <router-link to="/artworks">← Back</router-link>
  </div>
</template>

<script lang="ts">
import axios from 'axios'
import Gallery from '../../components/Gallery.vue'
import AuthorCard from '../../components/AuthorCard.vue'
import ErrorPage from '../../components/ErrorPage.vue'

export default {
  data() {
    return {
      loading: true,
      illust: {},
      user: {},
      error: '',
    }
  },
  components: {
    AuthorCard,
    Gallery,
    ErrorPage,
  },
  methods: {
    async init() {
      let data
      try {
        data = (
          await axios.get(
            `https://pixiv.wjghj.cn/api/illust/${this.$route.params.id}`
          )
        ).data
      } catch (err) {
        this.loading = false
        this.error = err.message
        return
      }
      document.title = `${data.illustTitle} | Artwork | PixivNow`
      this.loading = false
      this.illust = data
      this.getUser(data.userId)
    },
    async getUser(userId: number) {
      let data
      try {
        data = (await axios.get(`https://pixiv.wjghj.cn/api/user/${userId}`))
          .data
      } catch (err) {
        return
      }
      this.user = data
    },
  },
  mounted() {
    document.title = 'Artwork | PixivNow'
    this.init()
  },
}
</script>

<style scoped>
.loading {
  text-align: center;
}
h1,
h2 {
  text-align: center;
}
.card {
  box-shadow: 0 0 4px #888;
  border-radius: 4px;
  padding: 1rem;
}
</style>
