<template lang="pug">
.comment-submit(:data-illust_id="id")
  em 发表评论
  .flex.logged-in(v-if="userData")
    .left
      .avatar
        img(:src="API_BASE + userData.profileImg")
    .right
      textarea(v-model="comment" :disabled="loading")
    .submit.align-right
    button(@click="submit" :disabled="loading") 发送
  .flex.not-logged-in(v-if="!userData")
    p 
      | 您需要
      router-link(:to="'/login?back=' + $route.path") 设置 Pixiv 令牌
      | 以发表评论。
</template>

<script lang="ts" setup>
import axios from 'axios'
import Cookies from 'js-cookie'
import { ref } from 'vue'
import { API_BASE } from '../../config'
import { userData } from '../userData'

const loading = ref(false)
const comment = ref('')

const props = defineProps<{ id: string }>()
const emit = defineEmits<{
  (
    e: 'push-comment',
    value: {
      img: string
      commentDate: string
      [key: string]: any
    }
  ): void
}>()

function submit() {
  if (loading.value) return
  loading.value = true
  axios({
    method: 'post',
    url: `${API_BASE}/ajax/illusts/comments/post`,
    headers: {
      'X-CSRF-TOKEN': Cookies.get('csrf_token'),
    },
    data: {
      type: 'comment',
      illust_id: props.id,
      author_user_id: userData.value?.id,
      comment,
    },
  })
    .then(
      ({ data }) => {
        comment.value = ''
        emit('push-comment', {
          img: userData.value?.profileImg,
          commentDate: new Date().toLocaleString(),
          ...data,
        })
      },
      (err) => {
        console.error('Submit comment error', err)
        alert(`出大问题：${err.message}`)
      }
    )
    .finally(() => loading.value = false)
}
</script>

<style scoped lang="sass">

.right
  flex: 1

textarea
  width: 100%

.not-logged-in
  color: #888
</style>
