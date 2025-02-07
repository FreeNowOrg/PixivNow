<template lang="pug">
.artworks-by-user(ref='containerRef')
  NFlex(align='center' justify='center')
    NPagination(
      :item-count='artworkIds.length',
      :page-size='pageSize'
      v-model:page='curPage'
    )
  ArtworkList(
    :list='curArtworks',
    :loading='!curArtworks.length ? pageSize : false'
  )
  NFlex(align='center' justify='center')
    NPagination(
      :item-count='artworkIds.length',
      :page-size='pageSize'
      v-model:page='curPage'
    )
</template>

<script setup lang="ts">
import type { ArtworkInfo } from '~/types'
import { NPagination } from 'naive-ui'

const { userId, workCategory = 'illust' } = defineProps<{
  userId: string
  workCategory?: 'illust' | 'manga'
}>()

const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
const artworkIds = ref<string[]>([])
const pageSize = 24
const curPage = ref(1)
const cachedPages = ref<Record<number, ArtworkInfo[]>>({})
const curArtworks = computed(() => {
  return (cachedPages.value[curPage.value] || []).sort(
    (a, b) => Number(b.id) - Number(a.id)
  )
})

onMounted(async () => {
  firstInit()
})
watch(curPage, (page) => {
  backToTop()
  fetchArtworksByPage(page)
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
  artworkIds.value = []
  curPage.value = 1
  cachedPages.value = {}
  artworkIds.value = (await fetchAllArtworkIds()).sort(
    (a, b) => Number(b) - Number(a)
  )
  await fetchArtworksByPage(1)
}

async function fetchAllArtworkIds() {
  const data = await useAjaxResponse<{
    illusts: Record<string, unknown>
    manga: Record<string, unknown>
  }>(`/ajax/user/${userId}/profile/all`)
  const works =
    workCategory === 'illust'
      ? Object.keys(data.illusts)
      : Object.keys(data.manga)
  return works
}

function getArtworkIdsByPage(page: number) {
  return artworkIds.value.slice((page - 1) * pageSize, page * pageSize)
}

async function fetchArtworksByPage(page: number) {
  if (cachedPages.value[page]) return cachedPages.value[page]
  const ids = getArtworkIdsByPage(page)
  const data = await useAjaxResponse<{
    works: Record<string, ArtworkInfo>
  }>(`/ajax/user/${userId}/profile/illusts`, {
    params: {
      ids,
      work_category: workCategory,
      is_first_page: 0,
    },
  })
  cachedPages.value[page] = Object.values(data.works)
  return data
}
</script>

<style scoped lang="sass"></style>
