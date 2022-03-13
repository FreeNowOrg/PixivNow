<template lang="pug">
li.commentBlock
  .left
    router-link.plain(:to="'/users/' + comment.userId")
      img.avatar(
        :src="API_BASE + comment.img"
        :title="comment.userName+ ' (' + comment.userId + ')'"
      )
  .right
    h4.user
      span.commentAuthor
        | {{ comment.userName }}
        .tag(v-if="userData && userData.id === comment.userId") 您
      span.commentReply(v-if="comment.replyToUserId") &emsp;▶&emsp;{{ comment.replyToUserName }}
    .content(v-if="!comment.stampId" v-html="replaceStamps(comment.comment)")
    .content(v-if="comment.stampId")
        img.bigStamp(
          :src="API_BASE + '/~/common/images/stamp/generated-stamps/' + comment.stampId + '_s.jpg'"
          alt="表情包"
          lazyload)
    .commentDate {{ comment.commentDate }}
</template>

<script lang="ts" setup>
import { API_BASE } from '../../config'
import stampList from './stampList.json'
import { userData } from '../userData'
import type { Comments } from '../../types'

const props = defineProps<{ comment: Comments }>()

function replaceStamps(str: string): string {
  for (const [stampName, stampUrl] of Object.entries(stampList)) {
    str = str.replaceAll(`(${stampName})`, `<img src="${API_BASE}${stampUrl}" alt="表情包" lazyload>`)
  }
  return str
}
</script>

<style lang="sass">
.commentBlock
  display: flex
  gap: .6rem

  + .commentBlock
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

      .bigStamp
        width: 3em

      .stamp
        height: 1.4rem
        width: auto

    .commentDate
      font-size: .75em
      color: #aaa
</style>
