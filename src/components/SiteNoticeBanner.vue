<template lang="pug">
Transition(name='fade')
  #sitenotice-banner(v-if='isShow')
    NAlert(
      @close='handleClose'
      closable
      style='font-size: 1.5rem'
      title='全站公告'
      type='warning'
    )
      NUl
        NLi: RouterLink(to='/notifications/2024-04-26') 关于 PixivNow 将可能停止服务的通知（2024年4月26日）
</template>

<script setup lang="ts">
import {} from 'vue'

const alreadyShown = ref(false)
const forceShow = computed(
  () =>
    route.name === 'about-us' || Date.now() > new Date('2024-09-01').getTime()
)
const isShow = computed(() => {
  if (route.path === '/notifications/2024-04-26') {
    return false
  }
  if (forceShow.value) return true
  return !alreadyShown.value
})
const key = `pixivnow:sitenotice/2024-04-26`
const route = useRoute()

onMounted(() => {
  alreadyShown.value = !!localStorage.getItem(key)
})

function handleClose() {
  localStorage.setItem(key, '1')
  alreadyShown.value = 1
}
</script>

<style scoped lang="sass">
.fade-enter-active,
.fade-leave-active
  transition: all 0.5s ease-in-out

.fade-enter-from,
.fade-leave-to
  opacity: 0
  height: 0
</style>
