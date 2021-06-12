<template lang="pug">
h1 User \#{{ $route.params.id }}
p 这是 {{ $route.params.id }} 的用户页。(<s>敷衍</s>)
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
