<template lang="pug">
FnbProvider
  #app-full-container(
    :data-env='siteConfig.public.siteEnv',
    :data-route-name='route.name'
  )
    SiteNoticeBanner
    SiteHeader

    main
      article
        NuxtPage(
          :transition='{ enterActiveClass: "fade-in-up", leaveActiveClass: "fade-out-down", mode: "out-in" }'
        )

    SideNav
    SiteFooter
    NProgress
</template>

<script lang="ts" setup>
import NProgress from '~/components/NProgress.vue'
import SiteHeader from '~/components/SiteHeader.vue'
import SiteFooter from '~/components/SiteFooter.vue'
import { existsSessionId, initUser } from '~/composables/userData'
import { useUserStore } from '~/stores/session'

const SideNav = defineAsyncComponent(
  () => import('~/components/SideNav/SideNav.vue')
)

const userStore = useUserStore()
const route = useRoute()
const siteConfig = useRuntimeConfig()

onMounted(async () => {
  if (!existsSessionId()) {
    console.log('No session id found. Maybe you are not logged in?')
    userStore.logout()
    return
  }
  try {
    const userData = await initUser()
    userStore.login(userData)
  } catch (err) {
    console.error('User init failed:', err)
    userStore.logout()
  }
})
</script>

<style scoped lang="scss">
#app-full-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  position: relative;
  flex: 1;

  article {
    padding-bottom: 3rem;
    z-index: 1;
  }
}
</style>
