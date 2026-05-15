<template lang="pug">
section.redirecting.body-inner
  NSkeleton(text width='12rem')
</template>

<script lang="ts" setup>
definePageMeta({ name: 'novel-show-compat' })
import { NSkeleton } from 'naive-ui'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const id = route.query.id
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    router.replace(`/novels/${id}`)
  } else {
    router.replace('/404')
  }
})
</script>
