<template lang="pug">
.artworks-by-user(ref='containerRef')
  NFlex(align='center' justify='center')
    NPagination(
      :item-count='userArtworksStore.allIds.length',
      :page-size='userArtworksStore.pageSize'
      v-model:page='curPage'
    )
  ArtworkList(
    :list='curArtworks',
    :loading='!curArtworks.length ? userArtworksStore.pageSize : false'
  )
  NFlex(align='center' justify='center')
    NPagination(
      :item-count='userArtworksStore.allIds.length',
      :page-size='userArtworksStore.pageSize'
      v-model:page='curPage'
    )
</template>

<script setup lang="ts">
import { type ArtworkInfo } from '@/types'
import { NPagination } from 'naive-ui'
import { useUserArtworksStore } from '@/stores/user-artworks'

const props = withDefaults(
  defineProps<{
    userId: string
    workCategory?: 'illust' | 'manga'
  }>(),
  {
    workCategory: 'illust',
  }
)

const containerRef = ref<HTMLElement>()
const curPage = ref(1)
const userArtworksStore = useUserArtworksStore()

const curArtworks = computed(() => {
  return (userArtworksStore.cachedPages[curPage.value] || []).sort(
    (a: ArtworkInfo, b: ArtworkInfo) => Number(b.id) - Number(a.id)
  )
})

onMounted(async () => {
  firstInit()
})
watch(curPage, (page) => {
  backToTop()
  userArtworksStore.fetchPage(props.userId, page, props.workCategory)
})

function backToTop() {
  const container = containerRef.value!
  const top = container.getBoundingClientRect().top + window.scrollY - 120
  window.scrollTo({
    top,
    behavior: 'smooth',
  })
}

async function firstInit() {
  userArtworksStore.reset()
  curPage.value = 1
  await userArtworksStore.fetchAllIds(props.userId, props.workCategory)
  await userArtworksStore.fetchPage(props.userId, 1, props.workCategory)
}
</script>

<style scoped lang="sass"></style>
