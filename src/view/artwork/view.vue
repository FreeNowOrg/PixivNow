<template lang="pug">
h1 {{ loading ? '正在读取作品 #' + $route.params.id : illust.illustTitle }}

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
    .loading(v-if="!user.userId")
      placeholder
    author-card(:user="user" v-if="user.userId")
  
  card.description(title="简介" class="" v-if="illust.description")
    p(v-html="illust.description")
  
  card.about(title="关于")
    ul
      li
        strong 浏览：
        span {{ illust.viewCount }}
      li
        strong 点赞：
        span {{ illust.likeCount }}
      li
        strong 评论：
        span {{ illust.commentCount }}
      li
        strong 原创：
        span {{ illust.isOriginal ? '是' : '?' }}
      li
        strong 发布：
        span(:title="illust.createDate") {{ new Date(illust.createDate).toLocaleString() }}
    div(:style="{textAlign: 'center'}")
      a(
        :href="illust?.extraData?.meta?.canonical || '#'"
        target="_blank"
        rel="noopener noreferrer"
      ) 在 Pixiv 上查看 →

  .breadCrumb
    router-link.button(to="/artworks") ← 返回

  .showMoreBtn
    a(href="javascript:;" @click="showMore = true" v-if="!showMore") 查看更多<br>﹀
  
  .showMore(v-if="showMore")
    .userIllusts
      h2 用户作品
      artworks-list.inline(:list="illust?.userIllusts")
    .zengoIdWorks
      h2 相关推荐
      artworks-list.inline(:list="illust?.noLoginData?.zengoIdWorks")

    .showMoreBtn
      a(href="javascript:;" @click="showMore = false") ︿<br>收起

//- Error
section.error(v-if="error")
  error-page(title="出大问题" :description="error")
</template>

<script lang="ts">
import axios from 'axios'
import { API_BASE } from '../../config'

import AuthorCard from '../../components/AuthorCard.vue'
import ArtTag from '../../components/ArtTag.vue'
import ArtworksList from '../../components/ArtworksList/ArtworksList.vue'
import Card from '../../components/Card.vue'
import ErrorPage from '../../components/ErrorPage.vue'
import Gallery from '../../components/Gallery.vue'
import Placeholder from '../../components/Placeholder.vue'

export default {
  data() {
    return {
      loading: true,
      showMore: false,
      illust: {},
      user: {},
      comments: {},
      error: '',
    }
  },
  components: {
    AuthorCard,
    ArtTag,
    ArtworksList,
    Card,
    ErrorPage,
    Gallery,
    Placeholder,
  },
  methods: {
    async init() {
      if (!this?.$route?.params?.id) return

      this.loading = true

      axios
        .get(`${API_BASE}/api/illust/${this.$route.params.id}`, {
          params: {
            full: 1,
            lang: 'zh',
          },
        })
        .then(
          ({ data }) => {
            document.title = `${data.illustTitle} | Artwork | PixivNow`
            this.illust = data
            this.getUser(data.userId)
            this.getComments(data.id)
          },
          (err) => {
            console.warn('illust fetch error', `#${this.$route.params.id}`, err)
            this.error =
              err?.response?.data?.message || err.message || 'HTTP 请求超时'
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
    async getUser(userId: number) {
      axios.get(`${API_BASE}/api/user/${userId}`).then(
        ({ data }) => {
          this.user = data
        },
        (err) => {
          console.warn('User fetch error', err)
        }
      )
    },
    async getComments(id: string | number) {
      axios
        .get(`${API_BASE}/ajax/illusts/comments/roots`, {
          params: {
            illust_id: id || this.$route.params.id,
            limit: 50,
            lang: 'zh',
          },
        })
        .then(
          ({ data }) => {
            console.log('Comments', data)
            this.comments = data
          },
          (err) => {
            console.warn('Comments fetch error', err)
          }
        )
    },
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () => {
        if (this?.$route?.params?.id) {
          console.log('illust route')
          return this.init()
        }
      }
    )
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

.tags
  margin: 1rem 0

.breadCrumb
  margin-top: 1rem

.showMoreBtn
  margin-top: 1rem
  text-align: center
</style>
