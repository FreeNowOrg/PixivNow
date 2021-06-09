<template>
  <section class="error-404">
    <div class="title">404</div>
    <div class="description">啊咧？啊咧咧——？！页面跑丢了！！！</div>
    <div class="random" @click="random404">{{ msg }}</div>
  </section>
</template>

<script lang="ts">
function pick(list: any[]) {
  return list[Math.floor(Math.random() * list.length)]
}
const errMsg = [
  '就像装在游戏机盒子里的作业本一样没有人喜欢！',
  // FF14骚话
  '就像闪耀登场释放天辉的白魔法师一样没有人喜欢！',
  '就像冰4火4一个慢动作的黑魔法师一样没有人喜欢！',
  '就像耗尽了了以太超流的学者一样没有人喜欢！',
  '就像忘记了每分钟背刺的忍者一样没有人喜欢！',
  '就像进本后跳999接受LB需求退本一气呵成的龙骑一样没有人喜欢！',
  '就像成天把拉拉菲尔族成为食材的人一样没有人喜欢！',
  '就像死而不僵状态下的暗黑骑士一样没有人喜欢！',
  '就像无论如何也触发不了诗心的诗人一样没有人喜欢！',
]

export default {
  data() {
    return {
      msg: '',
    }
  },
  methods: {
    random404() {
      this.msg = pick(errMsg)
    },
  },
  mounted() {
    this.random404()
  },
}
</script>

<style scoped>
.error-404 {
  margin: 10rem auto;
  height: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.error-404 > div {
  width: 100%;
}
.title {
  font-size: 6rem;
  font-weight: bold;
}
.description {
  font-size: 1.5rem;
}
.random {
  color: #aaa;
  user-select: none;
  margin-top: 1rem;
}
</style>
