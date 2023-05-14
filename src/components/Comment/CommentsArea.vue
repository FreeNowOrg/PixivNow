<template lang="pug">
.comments-area(ref='commentsArea')
  //- CommentSubmit(:id="id" @push-comment="pushComment")
  em.stats
    | 共{{ count || comments.length || 0 }}条评论
  p(v-if='!comments.length && !loading') 还没有人发表评论呢~
  ul.comments-list(v-if='comments.length')
    comment(:comment='item' v-for='item in comments')
    .show-more.align-center
      NButton(
        :loading='loading'
        @click='async () => await init(id)'
        round
        secondary
        size='small'
        v-if='comments.length && hasNext'
      )
        template(#icon)
          IFasPlus
        | {{ loading ? '正在加载' : '查看更多' }}
  .align-center(v-if='!comments.length && loading')
    placeholder
</template>

<script lang="ts" setup>
import Comment from './Comment.vue'
import { ajax } from '@/utils/ajax'
import type { Comments } from '@/types'
import { NButton } from 'naive-ui'
import IFasPlus from '~icons/fa-solid/plus'

const loading = ref(false)
const comments = ref<Comments[]>([])
const hasNext = ref(false)

const props = defineProps<{
  id: string
  count: number
}>()

async function init(id: string | number): Promise<void> {
  if (loading.value) return
  if (!props.count) {
    hasNext.value = false
    comments.value = []
    loading.value = false
    return
  }

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

const commentsArea = ref<HTMLDivElement | null>(null)

const ob = useIntersectionObserver(
  commentsArea,
  async ([{ isIntersecting }]) => {
    if (isIntersecting) {
      await nextTick()
      init(props.id)
      ob.stop()
    }
  }
)
</script>

<style scoped lang="sass">

.comments-list
  list-style: none
  padding-left: 0
</style>
