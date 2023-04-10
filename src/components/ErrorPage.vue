<template lang="pug">
section.error-page
  NResult(
    :description='description',
    :status='status || "warning"',
    :title='title'
  )
    template(#footer)
      .random(@click='randomMsg') {{ msg }}
      .extra: slot
</template>

<script lang="ts" setup>
import { setTitle } from '@/utils/setTitle'
import { NResult } from 'naive-ui'
import { effect } from 'vue'

const msgList = [
  // 正经向提示
  '频繁遇到此问题？请通过关于里的联系方式联系我们！',
  '您可以尝试刷新页面。',
  // 日常玩梗
  '这像装在游戏机盒子里的作业本一样没有人喜欢！',
  '↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑↓↑',
  '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁',
  '卧槽 ²³³³³³³ 6666666 厉害了23333 ²³³³³³³³³³³ 2333 6666 ²³³ 666 太流弊了！！',
  '生命、宇宙以及任何事情的终极答案——42',
  '单击此处添加副标题',
  // 杰哥不要梗
  '阿伟你又在点炒饭哦，休息一下吧，念个书好不好？',
  '死了啦，都你害的啦！',
  // 音乐梗
  '変わったああああああああああああああ', // 你比蔷薇更美丽
  'だめだね、だめよだめなのよ——', // 像笨蛋一样
  '壊れた 僕なんてさ、息を止めて', // unravel
  'Groupons nous et demain. L’Internationale. Sera le genre humain.', // 国际歌
  // FF14 骚话
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
  '谁点的炒饭？请取餐。',
  // Destiny2 梗
  '噶迪恩荡。',
  '你的光能消散了。',
  '神谕正在准备吟唱他们的叠句。',
  // Cyberpunk2077 梗
  '梆梆哔铛~梆梆哔铛梆！',
  // 音游梗
  '您有一个小姐。',
  '这像劲爆纵连一样没有人喜欢！',
]

const props = defineProps<{
  title?: string
  description?: string
  status?:
    | 'warning'
    | '500'
    | 'error'
    | 'info'
    | 'success'
    | '404'
    | '403'
    | '418'
}>()
const msg = ref('')
function randomMsg(): void {
  const newValue = msgList[Math.floor(Math.random() * msgList.length)]
  if (newValue !== msg.value) {
    msg.value = newValue
  } else {
    randomMsg()
  }
}

effect(() => {
  setTitle(props.title, 'Error')
})

onMounted(() => {
  randomMsg()
})
</script>

<style scoped lang="sass">

.error-page
  padding: 10vh 0
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

.extra
  margin-top: 1em
</style>
