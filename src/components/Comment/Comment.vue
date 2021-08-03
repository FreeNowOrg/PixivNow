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

<script lang="ts">
import { defineComponent } from 'vue'
import { API_BASE } from '../../config'
import { stampList } from './stampList'
import { userData } from '../userData'

export interface Comment {
  userId: `${number}`
  userName: string
  isDeletedUser: boolean
  img: string
  id: `${number}`
  comment: string
  stampId: number | null
  stampLink: null
  commentDate: string
  commentRootId: string | null
  commentParentId: string | null
  commentUserId: `${number}`
  replyToUserId: string | null
  replyToUserName: string | null
  editable: boolean
  hasReplies: boolean
}

function replaceStamps(str: string) {
  const reg = new RegExp(
    `(${Object.keys(stampList)
      .map((i) => `\\(${i}\\)`)
      .join('|')})`,
    'g'
  )
  return str.replace(reg, (match) => {
    const key = match.replace(/[\(\)]/g, '')
    return `<img src="${API_BASE}${stampList[key]}" class="stamp">`
  })
}

export default defineComponent({
  props: ['comment'],
  methods: {
    replaceStamps,
  },
  data() {
    return {
      API_BASE,
      userData,
    }
  },
  mounted() {},
})
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
