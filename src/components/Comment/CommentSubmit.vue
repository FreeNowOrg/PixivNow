<template lang="pug">
.commentSubmit(:data-illust_id="id")
  em 发表评论
  .flex.isLoggedIn(v-if="userData")
    .left
      .avatar
        img(:src="API_BASE + userData.userImageUrl")
    .right
      textarea(v-model="comment" :disabled="loading")
    .submit.align-right
    button(@click="submit" :disabled="loading") 发送
  .flex.notLogIn(v-if="!userData")
    p 
      | 您需要
      router-link(:to="'/login?back=' + $route.path") 设置 Pixiv 令牌
      | 以发表评论。
</template>

<script lang="ts">
import axios from 'axios'
import Cookies from 'js-cookie'
import { defineComponent } from 'vue'
import { API_BASE } from '../../config'
import { userData } from '../userData'

export default defineComponent({
  props: ['id'],
  data() {
    return {
      comment: '',
      userData,
      loading: false,
    }
  },
  methods: {
    submit() {
      if (this.loading) return
      this.loading = true

      axios({
        method: 'post',
        url: `${API_BASE}/rpc/post_comment.php`,
        data: {
          type: 'comment',
          illust_id: this.id,
          author_user_id: userData.value?.id,
          comment: this.comment,
        },
        headers: {
          'x-csrf-token': Cookies.get('csrfToken'),
        },
      })
        .then(
          ({ data }) => {
            this.comment = ''
            this.$emit('push-comment', {
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
        .finally(() => {
          this.loading = false
        })
    },
  },
})
</script>

<style scoped lang="sass">
.right
  flex: 1

textarea
  width: 100%

.notLogIn
  color: #888
</style>
