<template lang="pug">
.searchBox
  input(v-model="keyword" @keyup.enter="makeSearch", placeholder="搜索插画")
  fa.icon(icon="search")
</template>

<script lang="ts">
import { router } from '../router'
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      keyword: (this.$route.params.keyword as string) || '',
    }
  },
  methods: {
    makeSearch() {
      if (!this.keyword) {
        return
      }
      router.push(`/search/${encodeURIComponent(this.keyword)}/1`)
    },
  },
  created() {
    this.$watch(
      () => this.$route.params,
      () =>
        this.$route.params.keyword
          ? (this.keyword = this.$route.params.keyword as string)
          : null
    )
  },
})
</script>

<style lang="sass"></style>
