<template lang="pug">
.show-more(ref='elRef')
  a(@click='method')
    | {{ text }}
    | &nbsp;
    i-fa-solid-plus(v-if='!loading')
    i-fa-solid-spinner.spin(v-else)
</template>

<script lang="ts" setup>
const elRef = ref<HTMLElement>()
const props = defineProps<{
  text: string
  method: () => void
  loading: boolean
}>()

let observer: IntersectionObserver
onMounted(() => {
  const el = elRef.value
  if (!el) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) {
      console.info('into view')
      props?.method()
    }
  })
  observer.observe(el)
})
onBeforeUnmount(() => {
  observer && observer.disconnect()
})
</script>

<style scoped lang="sass">

.show-more
  text-align: center

  a
    display: inline-block
    margin: 1rem auto
    background-color: var(--theme-tag-color)
    padding: 0.4rem 8rem
    border-radius: 4px
    cursor: pointer
</style>
