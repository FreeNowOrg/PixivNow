<template lang="pug">
section.error-page
  .title
    span {{ title }}
  .description {{ description }}
  .random(@click="randomMsg") {{ msg }}
  //- SearchBox(class="big" :style="{margin: '3rem'}")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SearchBox from './SearchBox.vue'

function pick(list: any[]) {
  return list[Math.floor(Math.random() * list.length)]
}
const msgList = [
  // 日常玩梗
  '这像装在游戏机盒子里的作业本一样没有人喜欢！',
  '↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑',
  '卧槽 ²³³³³³³ 6666666 厉害了23333 ²³³³³³³³³³³ 2333 6666 ²³³ 666 太流弊了！！',
  '阿伟你又在点炒饭哦，休息一下吧，念个书好不好？',
  '单击此处添加副标题',
  // FF14骚话
  '这像闪耀登场释放天辉的白魔法师一样没有人喜欢！',
  '这像冰4火4一个慢动作的黑魔法师一样没有人喜欢！',
  '这像耗尽了了以太超流的学者一样没有人喜欢！',
  '这像忘记了每分钟背刺的忍者一样没有人喜欢！',
  '这像进本后跳999接受LB需求退本一气呵成的龙骑一样没有人喜欢！',
  '这像把拉拉菲尔族当做食材的人一样没有人喜欢！',
  '这像死而不僵状态下的暗黑骑士一样没有人喜欢！',
  '这像诗人触发不了诗心一样没有人喜欢！',
  // 程序员梗
  '锟斤拷锟斤拷锟斤拷锟斤拷锟斤拷',
  '烫烫烫烫烫烫烫烫烫烫烫烫烫烫烫',
  '程序员 酒吧 炒饭 炸了',
  // 音游梗
  '您有一个小姐。',
  '这像劲爆纵连一样没有人喜欢！',
]

export default defineComponent({
  components: { SearchBox },
  props: ['title', 'description'],
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
  margin: 20vh auto
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
    text-shadow: 2px 2px var(--theme-text-shadow-color)
    padding: 0 0.4em

.description
  font-size: 1.5rem

.random
  color: #aaa
  user-select: none
  margin-top: 1rem
</style>
