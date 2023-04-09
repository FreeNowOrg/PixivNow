<template lang="pug">
#error-view
  ErrorPage(
    description='啊咧？啊咧咧——？！页面跑丢了！！！'
    status='404'
    title='404 Not Found'
  )
    RouterLink(to='/'): NButton(type='primary') Take me home
</template>

<script lang="ts" setup>
import ErrorPage from '@/components/ErrorPage.vue'
import { NButton } from 'naive-ui'
</script>
