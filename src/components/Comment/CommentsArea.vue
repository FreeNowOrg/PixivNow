<template lang="pug">
.comments-area(ref='commentsArea')
  //- CommentSubmit(:id="id" @push-comment="pushComment")
  em.stats
    | 共{{ count || comments.length || 0 }}条评论
  p(v-if='!comments.length && !loading') 还没有人发表评论呢~
  ul.comments-list(v-if='comments.length')
    comment(:comment='item' v-for='item in comments')
    .show-more.align-center
      a.button(
        @click='async () => await init(id)'
        v-if='comments.length && hasNext'
      )
        | {{ loading ? '正在加载' : '查看更多' }}
        | &nbsp;
        i-fa-solid-plus(v-if='!loading')
        i-fa-solid-spinner.spin(v-else)
  .align-center(v-if='!comments.length && loading')
    placeholder
</template>

<script lang="ts" setup>
import Comment from './Comment.vue'
import { ajax } from '@/utils/ajax'
import type { Comments } from '@/types'
import { getElementUntilIntoView } from '@/utils/getElementUntilIntoView'

const loading = ref(false)
const comments = ref<Comments[]>([])
const hasNext = ref(false)

const props = defineProps<{
  id: string
  count: number
}>()

async function init(id: string | number): Promise<void> {
  if (loading.value) return

  try {
    loading.value = true
    const { data } = await ajax.get(`/ajax/illusts/comments/roots`, {
      params: new URLSearchParams({
        illust_id: `${id}`,
        limit: comments.value.length ? '30' : '3',
        offset: `${comments.value.length}`,
      }),
    })
    hasNext.value = data.hasNext
    comments.value = comments.value.concat(data.comments)
  } catch (err) {
    console.warn('Comments fetch error', err)
  } finally {
    loading.value = false
  }
}

function pushComment(data: Comments) {
  console.log(data)
  comments.value.unshift(data)
}

const commentsArea = ref<HTMLElement>()
onMounted(async () => {
  if (!props.id) {
    console.warn('Component CommentsArea missing param: id')
    return
  }
  await nextTick()
  await getElementUntilIntoView(commentsArea.value!)
  init(props.id)
})
</script>

<style scoped lang="sass">

.comments-list
  list-style: none
  padding-left: 0
</style>
