<template lang="pug">
#error-view
  error-page(title='404', description='啊咧？啊咧咧——？！页面跑丢了！！！')
</template>

<script lang="ts">
import ErrorPage from '../components/ErrorPage.vue'
export default {
  setup() {},
  components: {
    ErrorPage,
  },
}
</script>

<style scoped></style>
