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
const { userId, workCategory = 'illust' } = defineProps<{
  userId: string
  workCategory?: 'illust' | 'manga'
}>()

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
  userArtworksStore.fetchPage(userId, page, workCategory)
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
  await userArtworksStore.fetchAllIds(userId, workCategory)
  await userArtworksStore.fetchPage(userId, 1, workCategory)
}
</script>

<style scoped lang="sass"></style>
