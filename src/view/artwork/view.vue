<template lang="pug">
.navbar
  router-link(to="/artworks") ← Back

h1 {{ loading ? '正在加载 #' + $route.params.id : illust.illustTitle }}

//- Loading
section.loading(v-if="loading")
  placeholder

//- Done
section.illust-container(v-if="!error && !loading")
  gallery(:pages="illust.pages" )
  .tags
    art-tag(:key="_" v-for="(item, _) in illust.tags.tags" :tag="item.tag")
  
  .author
    h2 作者
    author-card(:user="user" )
  
  card.description(title="简介" class="" v-if="illust.description")
    p(v-html="illust.description")
  
  card.more(title="关于")
    p
      strong 发布于：
      | {{ illust.createDate }}
    p
      a(
        :href="'https://www.pixiv.net/artworks/' + $route.params.id"
        target="_blank"
        rel="noopener noreferrer"
      ) 在 Pixiv 上查看

//- Error
section.error(v-if="error")
  error-page(title="出大问题" :description="error.message")

.navbar
  router-link(to="/artworks") ← Back
</template>

<script lang="ts">
import axios from 'axios'

import AuthorCard from '../../components/AuthorCard.vue'
import ArtTag from '../../components/ArtTag.vue'
import Card from '../../components/Card.vue'
import ErrorPage from '../../components/ErrorPage.vue'
import Gallery from '../../components/Gallery.vue'
import Placeholder from '../../components/Placeholder.vue'

const API = 'https://pixiv.js.org'

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
    ArtTag,
    Card,
    ErrorPage,
    Gallery,
    Placeholder,
  },
  methods: {
    async init() {
      let data
      try {
        data = (await axios.get(`${API}/api/illust/${this.$route.params.id}`))
          .data
        console.log('illust', this.$route.params.id, data)
      } catch (err) {
        console.warn('illust error', err.response)
        this.loading = false
        this.error = err
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
        data = (await axios.get(`${API}/api/user/${userId}`)).data
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

<style scoped lang="sass">
.loading
  text-align: center

h1,
h2
  text-align: center

.tags
  margin: 1rem 0
</style>
