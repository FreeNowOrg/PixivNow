<template lang="pug">
section.error-page
  .title: span {{ title }}
  .description {{ description }}
  .random(@click="randomMsg") {{ msg }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
function pick(list: any[]) {
  return list[Math.floor(Math.random() * list.length)]
}
const msgList = [
  '就像装在游戏机盒子里的作业本一样没有人喜欢！',
  // FF14骚话
  '就像闪耀登场释放天辉的白魔法师一样没有人喜欢！',
  '就像冰4火4一个慢动作的黑魔法师一样没有人喜欢！',
  '就像耗尽了了以太超流的学者一样没有人喜欢！',
  '就像忘记了每分钟背刺的忍者一样没有人喜欢！',
  '就像进本后跳999接受LB需求退本一气呵成的龙骑一样没有人喜欢！',
  '就像成天把拉拉菲尔族当做食材的人一样没有人喜欢！',
  '就像死而不僵状态下的暗黑骑士一样没有人喜欢！',
  '就像无论如何也触发不了诗心的诗人一样没有人喜欢！',
]

export default defineComponent({
  props: ['title', 'desc'],
  data() {
    return {
      msg: '',
    }
  },
  methods: {
    randomMsg() {
      this.msg = pick(msgList)
    },
  },
  created() {
    document.title = 'Error | PixivNow'
    this.randomMsg()
  },
})
</script>

<style scoped lang="sass">
.error-page
  margin: 10rem auto
  height: 100%
  text-align: center
  display: flex
  align-items: center
  flex-wrap: wrap

  > div
    width: 100%

.title
  font-size: 5rem
  font-weight: bold
  margin-bottom: 0.4em

  > span
    box-shadow: 0 -0.5em 0 rgb(54, 151, 231) inset
    text-shadow: 2px 2px #fff
    padding: 0 0.4em

.description
  font-size: 1.5rem

.random
  color: #aaa
  user-select: none
  margin-top: 1rem
</style>
