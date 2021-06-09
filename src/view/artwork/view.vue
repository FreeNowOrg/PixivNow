<template>
  <h1>
    {{ loading ? 'Loading artwork #' + $route.params.id : illust.illustTitle }}
  </h1>
  <section class="loading" v-if="loading">Loading...</section>
  <section class="illust-container" v-if="!error && !loading">
    <Gallery :pages="illust.pages" />
    <div class="">
      <h2>作者</h2>
      <AuthorCard :user="user" />
    </div>
    <div class="description" v-if="illust.description">
      <h2>简介</h2>
      <p class="card" v-html="illust.description"></p>
    </div>
  </section>
  <section class="error" v-if="error">
    <strong>啊这，出了点问题呢……</strong>
    <p>
      {{ error }}
    </p>
  </section>
</template>

<script lang="ts">
import axios from 'axios'
import Gallery from '../../components/Gallery.vue'
import AuthorCard from '../../components/AuthorCard.vue'

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
    this.init()
  },
}
</script>

<style scoped>
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
