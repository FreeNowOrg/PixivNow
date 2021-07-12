<template lang="pug">
li.commentBlock
  .left
    router-link.plain(:to="'/users/' + comment.userId")
      .avatar(
        :style="'background-image: url(' + API_BASE + comment.img + ')'"
        :title="comment.userName+ ' (' + comment.userId + ')'"
      )
  .right
    h4.user
      span.commentAuthor
        router-link(:to="'/users/' + comment.userId") {{ comment.userName }}
      span.commentReply(v-if="comment.replyToUserId")
        | &emsp;▶&emsp;
        router-link(:to="'/users/' + comment.userId") {{ comment.replyToUserName }}
    .content(v-if="!comment.stampId" v-html="replaceStamps(comment.comment)")
    .content(v-if="comment.stampId")
        img.bigStamp(:src="API_BASE + '/~/common/images/stamp/generated-stamps/' + comment.stampId + '_s.jpg'")
    .commentDate {{ comment.commentDate }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { API_BASE } from '../../config'
import { stampList } from './stampList'

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
    }
  },
  mounted() {},
})
</script>

<style lang="sass" scoped>
.commentBlock
  display: flex
  gap: .6rem

  + .commentBlock
    margin-top: .6em

  .left
    a
      flex: none

    .avatar
      width: 4rem
      height: 4rem
      background-size: 4rem
      border-radius: 50%

  .right
    .user
      margin: 0 0 .3em

    .content
      white-space: pre-wrap
      margin-bottom: .3em

      .bigStamp
        width: 3em

    .commentDate
      font-size: .75em
</style>
