<template lang="pug">
li.commentBlock
  .left
    img.avatar(
      :src="API_BASE + comment.img"
      :title="comment.userName+ ' (' + comment.userId + ')'"
    )
  .right
    h4.user
      router-link(:to="'/users' + comment.userId") {{ comment.userName }}
    div
      .content(v-if="!comment.stampId" v-html="replaceStamps(comment.comment)")
      .content(v-if="comment.stampId")
        img.bigStamp(:src="API_BASE + '/common/images/stamp/generated-stamps/' + comment.stampId + '_s.jpg'")
      .commentDate {{ comment.commentDate }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { API_BASE } from '../../config'
import { stampList } from './stampList'

function replaceStamps(str: string) {
  const reg = new RegExp(
    '(' +
      Object.keys(stampList)
        .map((i) => `\\(${i}\\)`)
        .join('|') +
      ')',
    'g'
  )
  str = str.replace(reg, (match) => {
    const key = match.replace(/[\(\)]/g, '')
    const src = `${API_BASE}${stampList[key]}`
    return `<img src="${src}" class="stamp">`
  })
  return str
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
</style>
