<template lang="pug">
.show-more(ref='elRef')
  a(@click='method')
    | {{ text }}
    | &nbsp;
    IPlus(v-if='!loading')
    ISpinner.spin(v-else)
</template>

<script lang="ts" setup>
import IPlus from '~icons/fa-solid/plus'
import ISpinner from '~icons/fa-solid/spinner'

const elRef = ref<HTMLDivElement | null>(null)

const props = defineProps<{
  text: string
  method: () => any | Promise<any>
  loading: boolean
}>()

useIntersectionObserver(elRef, async ([{ isIntersecting }]) => {
  if (isIntersecting) {
    await nextTick()
    props.method()
  }
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
