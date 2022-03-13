<template lang="pug">
.commentsArea
  //- CommentSubmit(:id="id" @push-comment="pushComment")
  em.stats
    | 共{{ count || comments.length || 0 }}条评论
  p(v-if="!comments.length && !loading") 还没有人发表评论呢~
  ul.commentsList(v-if="comments.length")
    comment(v-for="item in comments" :comment="item")
    .showMore.align-center
      a.button(
        v-if="comments.length && hasNext"
        @click="init(id)"
      )
        | {{ loading ? '正在加载' : '查看更多' }}
        | &nbsp;
        fa(
          :icon="loading ? 'spinner' : 'plus'"
          :spin="loading")
  .align-center(v-if="!comments.length && loading")
    placeholder
</template>

<script lang="ts" setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { API_BASE } from '../../config'

import Comment from './Comment.vue'
import Placeholder from '../Placeholder.vue'

const loading = ref(false)
const comments = ref<any[]>([])
const hasNext = ref(false)

const props = defineProps<{
  id: string
  count: number
}>()

async function init(id: string | number): Promise<void> {
  if (loading.value) return
  loading.value = true

  axios
    .get(`${API_BASE}/ajax/illusts/comments/roots`, {
      params: {
        illust_id: id,
        limit: comments.value.length ? 30 : 3,
        offset: comments.value.length,
      },
    })
    .then(
      ({ data }) => {
        console.log('Comments', data)
        hasNext.value = data.hasNext
        comments.value = [...comments.value, ...data.comments]
      },
      (err) => console.warn('Comments fetch error', err)
    )
    .finally(() => loading.value = false)
}

function pushComment(data: any) {
  console.log(data)
  comments.value.unshift(data)
}

onMounted(async () => {
  if (!props.id)
    return console.info('Component CommentsArea missing param: id')
  await init(props.id)
})
</script>

<style scoped lang="sass">
.commentsList
  list-style: none
  padding-left: 0
</style>
