<template>
  <footer class="globalFooter">
    <p>&copy; Copyright {{ yearStr }} Wjghj-Project/pixiv-now</p>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'comp-footer',
  setup() {
    const year = new Date().getFullYear()
    return {
      yearStr: 2021 === year ? year : `(2021 - ${year})`,
    }
  },
})
</script>
<style scoped>
.globalFooter {
  background-color: rgb(54, 151, 231);
  padding: 0.4rem;
  font-size: 1rem;
  color: #fff;
}
</style>
