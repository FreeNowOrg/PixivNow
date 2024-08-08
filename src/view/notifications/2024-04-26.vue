<template lang="pug">
#notification-view.body-inner
  h1.align-center 关于 PixivNow 将可能停止服务的通知（2024年4月26日）
  Card
    p 各位，早上好中午好晚上好：
    p 我们希望通知您，由于 Vercel 在 2024年4月4日 对其<a href="https://vercel.com/blog/improved-infrastructure-pricing" target="_blank">定价策略</a>进行了修改，细化了收费指标，这对我们的项目产生了重大影响。特别是，我们的项目在部分指标上的用量<strong>已经远超过了</strong>免费计划的限额。由于 PixivNow 是一个开源项目，并且到目前为止我们<strong>没有任何盈利</strong>，我们很难为了这个兴趣使然的项目自掏腰包。
    p 幸运的是，Vercel 为现有的免费计划用户提供了 6 个月的缓冲期，这意味着我们的服务在接下来的六个月内不会受到影响。但是在此之后（大约是 2024年9月），我们的服务有极大概率将被迫中断。
    p 在接下来的几个月里，我们将探索所有可能的解决方案以继续提供服务（前提是尽量不要花钱）。
    p 我们非常感谢您一直以来对 PixivNow 的支持和理解。如果您希望继续支持我们，我们正在考虑接受赞助来帮助维持项目的运行。您可以通过访问我们的赞助页面了解更多信息，并考虑成为我们的赞助者。

    .flex(style='justify-content: center')
      NStatistic(
        label='死亡倒计时'
        style='border: 1px solid #efefef; padding: 0.5rem; border-radius: 0.25rem'
      )
        NCountdown(:duration='duration')

    div(style='text-align: right')
      strong Dragon Fish
      br
      time 2024年4月26日

  Card(title='赞助我们')
    .align-center
      iframe(
        frameborder='0'
        height='200'
        scrolling='no'
        src='https://afdian.com/leaflet?slug=dragon-fish'
        width='640'
      )

  Card(title='联系我们')
    ul
      li QQ群：1026023666
</template>

<script setup lang="ts">
import {} from 'vue'

const fromTime = new Date()
const toTime = new Date('2024-09-30T23:59:59Z')
const duration = toTime.getTime() - fromTime.getTime()
</script>

<style scoped lang="sass"></style>
