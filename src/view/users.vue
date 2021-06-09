<template>
  <h1>Users</h1>
  <div>{{ msg }}</div>
</template>

<script lang="ts">
import { useRoute } from 'vue-router'
export default {
  props: {
    msg: String,
  },
  setup() {
    const route = useRoute()
    const userId = route.params.id
    return {
      name: 'view-users',
      msg: `View user ${userId}`,
    }
  },
}
</script>

<style></style>
