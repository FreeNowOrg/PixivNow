<template lang="pug">
li.comment-block
  .left
    router-link.plain(:to="'/users/' + comment.userId")
      img.avatar(
        :src="API_BASE + comment.img"
        :title="comment.userName + ' (' + comment.userId + ')'"
      )
  .right
    h4.user
      span.comment-author
        | {{ comment.userName }}
        .tag(v-if="store.userId === comment.userId") 您
      span.comment-reply(v-if="comment.replyToUserId") &emsp;▶&emsp;{{ comment.replyToUserName }}
    .content(v-if="!comment.stampId" v-html="replaceStamps(comment.comment)")
    .content(v-if="comment.stampId")
      img.big-stamp(
        :src="API_BASE + '/~/common/images/stamp/generated-stamps/' + comment.stampId + '_s.jpg'"
        alt="表情包"
        lazyload)
    .comment-date {{ comment.commentDate }}
</template>

<script lang="ts" setup>
import { API_BASE } from '../../config'
import stampList from './stampList.json'
import type { Comments } from '../../types'
import { useUserStore } from '../../states'

const props = defineProps<{ comment: Comments }>()
const store = useUserStore()

function replaceStamps(str: string): string {
  for (const [stampName, stampUrl] of Object.entries(stampList)) {
    str = str.replaceAll(
      `(${stampName})`,
      `<img class="stamp" src="${API_BASE}${stampUrl}" alt="表情包" lazyload>`
    )
  }
  return str
}
</script>

<style lang="sass">

.comment-block
  display: flex
  gap: .6rem

  + .comment-block
    margin-top: 1rem

  .left
    flex: none

    .avatar
      width: 40px
      height: 40px
      background-size: 40px
      border-radius: 50%

  .right
    .user
      margin: 0 0 .3em

    .content
      white-space: pre-wrap
      margin-bottom: .3em

      .big-stamp
        width: 3em

      .stamp
        height: 1.4rem
        width: auto

    .comment-date
      font-size: .75em
      color: #aaa
</style>
