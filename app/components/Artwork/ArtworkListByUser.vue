<template lang="pug">
.artworks-by-user(ref='containerRef')
  .flex.justify-center.align-center
    FnbPagination(
      :item-count='storeAllIds.length',
      :page='curPage',
      :page-size='userArtworksStore.pageSize'
      @update:page='curPage = $event'
    )
  ArtworkList(
    :list='curArtworks',
    :loading='!curArtworks.length ? userArtworksStore.pageSize : false'
  )
  .flex.justify-center.align-center
    FnbPagination(
      :item-count='storeAllIds.length',
      :page='curPage',
      :page-size='userArtworksStore.pageSize'
      @update:page='curPage = $event'
    )
</template>

<script setup lang="ts">
import type { ArtworkInfo } from '~/types'
import { useUserArtworksStore } from '~/stores/user-artworks'

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

const storeAllIds = computed(() => userArtworksStore.allIds(props.workCategory))
const storeCachedPages = computed(() =>
  userArtworksStore.cachedPages(props.workCategory)
)

const curArtworks = computed(() => {
  return (storeCachedPages.value[curPage.value] || []).sort(
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
  curPage.value = 1
  await userArtworksStore.fetchAllIds(props.userId, props.workCategory)
  await userArtworksStore.fetchPage(props.userId, 1, props.workCategory)
}
</script>

<style scoped lang="scss">
.flex {
  display: flex;
}
.justify-center {
  justify-content: center;
}
.align-center {
  align-items: center;
}
</style>
