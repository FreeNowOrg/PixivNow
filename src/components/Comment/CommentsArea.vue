<template lang="pug">
.commentsArea
  CommentSubmit(:id="id" @push-comment="pushComment")
  em.stats
    | 共{{ comments.length }}条评论
  p(v-if="!comments.length && !loading") 还没有人发表评论呢~
  ul.commentsList(v-if="comments.length")
    comment(v-for="item in comments" :comment="item")
    .showMore.align-center
      a.button(
        v-if="comments.length && hasNext"
        @click="getComments(id)"
      )
        | {{ loading ? '正在加载' : '查看更多' }}
        | &nbsp;
        fa(
          :icon="loading ? 'spinner' : 'plus'"
          :spin="loading")
  .align-center(v-if="!comments.length && loading")
    placeholder
</template>

<script lang="ts">
import axios from 'axios'
import { defineComponent } from 'vue'
import { API_BASE } from '../../config'

import Comment from './Comment.vue'
import CommentSubmit from './CommentSubmit.vue'
import Placeholder from '../Placeholder.vue'

export default defineComponent({
  props: ['id'],
  components: { Comment, CommentSubmit, Placeholder },
  data() {
    return {
      API_BASE,
      loading: false,
      comments: [] as any[],
      hasNext: false,
    }
  },
  methods: {
    async init(id: string | number) {
      if (this.loading) return
      this.loading = true

      axios
        .get(`${API_BASE}/ajax/illusts/comments/roots`, {
          params: {
            illust_id: id,
            limit: this.comments.length ? 30 : 3,
            offset: this.comments.length,
          },
        })
        .then(
          ({ data }) => {
            console.log('Comments', data)
            this.hasNext = data.hasNext
            this.comments = [...this.comments, ...data.comments]
          },
          (err) => {
            console.warn('Comments fetch error', err)
          }
        )
        .finally(() => {
          this.loading = false
        })
    },
    pushComment(data: any) {
      console.log(data)
      this.comments.unshift(data)
    },
  },
  mounted() {
    if (!this.id)
      return console.info('Component CommentsArea missing param: id')
    this.init(this.id)
  },
})
</script>

<style scoped lang="sass">
.commentsList
  list-style: none
  padding-left: 0
</style>
