<template lang="pug">
.show-more(ref='elRef')
  a(@click='method')
    | {{ text }}
    | &nbsp;
    i-fa-solid-plus(v-if='!loading')
    i-fa-solid-spinner.spin(v-else)
</template>

<script lang="ts" setup>
import { getElementUntilIntoView } from '@/utils/getElementUntilIntoView'

const elRef = ref<HTMLElement>()
const props = defineProps<{
  text: string
  method: () => any | Promise<any>
  loading: boolean
}>()

async function mountObserver(el: HTMLElement) {
  await getElementUntilIntoView(el)
  await props?.method()
  mountObserver(el)
}

onMounted(async () => {
  await nextTick()
  const el = elRef.value!
  mountObserver(el)
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
