<template>
  <Header />
  <main>
    <article><router-view /></article>
  </main>
  <Footer />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

export default defineComponent({
  name: 'App',
  components: { Header, Footer },
})
</script>

<style scoped>
main article {
  /* min-height: 100vh; */
  padding: 1rem;
}
</style>
