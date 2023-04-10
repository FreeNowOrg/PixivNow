<template lang="pug">
.show-more(ref='elRef')
  a(@click='method')
    | {{ text }}
    | &nbsp;
    IFaSolidPlus(v-if='!loading')
    IFaSolidSpinner.spin(v-else)
</template>

<script lang="ts" setup>
import IFaSolidPlus from '~icons/fa-solid/plus'
import IFaSolidSpinner from '~icons/fa-solid/spinner'
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
