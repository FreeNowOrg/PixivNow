<template lang="pug">
li.comment-block
  .left
    RouterLink.plain(:to='"/users/" + comment.userId')
      img.avatar(
        :src='comment.img',
        :title='comment.userName + " (" + comment.userId + ")"'
      )
  .right
    .comment-head
      RouterLink.comment-author.plain(:to='"/users/" + comment.userId') {{ comment.userName }}
      span.tag(:class='{ "tag--author": badge.author }', v-if='badge') {{ badge.text }}
      span.comment-reply(v-if='comment.replyToUserName')
        IFasReply.reply-icon(aria-hidden='true')
        | {{ comment.replyToUserName }}
    .content(v-html='replaceStamps(comment.comment)' v-if='!comment.stampId')
    .content(v-if='comment.stampId')
      img.big-stamp(
        :src='pximgS(`common/images/stamp/generated-stamps/${comment.stampId}_s.jpg`)'
        alt='表情包'
        lazyload
      )
    .comment-date {{ comment.commentDate }}

    //- Replies (one level deep), lazily loaded on click
    .comment-replies(v-if='comment.hasReplies')
      ul.replies-list(v-if='replies.length')
        Comment(
          :author-id='authorId',
          :comment='reply',
          :key='reply.id',
          :type='type',
          v-for='reply in replies'
        )
      button.view-replies(
        :disabled='repliesLoading',
        @click='loadReplies',
        v-if='replies.length ? repliesHasNext : true'
      )
        | {{ repliesLoading ? '加载中…' : replies.length ? '查看更多回复' : '查看回复' }}
</template>

<script lang="ts" setup>
import stampList from './stampList.json'
import type { Comments } from '~/types'
import { useUserStore } from '~/stores/session'
import { pximgS } from '~/utils/pximg'
import IFasReply from '~icons/fa-solid/reply'

const props = withDefaults(
  defineProps<{
    comment: Comments
    type?: 'illust' | 'novel'
    /** The work's author id — their comments get a 作者 badge. */
    authorId?: string
  }>(),
  { type: 'illust' }
)
const store = useUserStore()
const pixivClient = usePixivClient()

// Badge: 您 for the logged-in user, 作者 for the work's author. When the
// commenter is both, show 您 but keep the author badge colour.
const badge = computed(() => {
  const isSelf = !!store.userId && props.comment.userId === store.userId
  const isAuthor = !!props.authorId && props.comment.userId === props.authorId
  if (!isSelf && !isAuthor) return null
  return { text: isSelf ? '您' : '作者', author: isAuthor }
})

const replies = ref<Comments[]>([])
const repliesPage = ref(0)
const repliesHasNext = ref(false)
const repliesLoading = ref(false)

async function loadReplies(): Promise<void> {
  if (repliesLoading.value) return
  try {
    repliesLoading.value = true
    const nextPage = repliesPage.value + 1
    const data = await pixivClient.getCommentReplies(
      props.comment.id,
      nextPage,
      props.type
    )
    replies.value = replies.value.concat(data.comments)
    repliesHasNext.value = data.hasNext
    repliesPage.value = nextPage
  } catch (err) {
    console.warn('Comment replies fetch error', err)
  } finally {
    repliesLoading.value = false
  }
}

function replaceStamps(str: string): string {
  for (const [stampName, stampId] of Object.entries(stampList)) {
    const stampUrl = pximgS(`common/images/emoji/${stampId}.png`)
    str = str.replaceAll(
      `(${stampName})`,
      `<img class="stamp" src="${stampUrl}" alt="表情包" lazyload>`
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
    min-width: 0
    flex: 1

    .comment-head
      display: flex
      align-items: center
      flex-wrap: wrap
      gap: .4rem
      margin-bottom: .25em

    .comment-author
      font-weight: 700
      color: var(--fnb-text)

    .tag
      display: inline-flex
      align-items: center
      padding: .05rem .35rem
      font-size: .68rem
      font-weight: 700
      line-height: 1.4
      color: var(--fnb-on-brand)
      background: var(--fnb-brand)
      border-radius: var(--fnb-radius-sm)

      &.tag--author
        background: var(--fnb-accent)

    .comment-reply
      display: inline-flex
      align-items: center
      gap: .25rem
      font-size: .8rem
      color: var(--fnb-text-muted)

      .reply-icon
        font-size: .72em

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
      color: var(--fnb-text-muted)

    .comment-replies
      margin-top: .6rem

    .replies-list
      list-style: none
      padding-left: 0
      margin: .6rem 0 0

    .view-replies
      border: none
      background: none
      padding: 0
      cursor: pointer
      font: inherit
      font-size: .8rem
      font-weight: 700
      color: var(--fnb-brand)

      &:hover:not(:disabled)
        text-decoration: underline

      &:disabled
        color: var(--fnb-text-muted)
        cursor: default
</style>
