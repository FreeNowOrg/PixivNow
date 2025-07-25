<template lang="pug">
#home-view
  .top-slider.align-center(:style='topSliderStyles')
    section.search-area.flex-1
      SearchBox.big.search

    .site-logo
      img(src='/images/LogoH.png')
    .description Now, everyone can enjoy Pixiv

    .bg-info
      a.pointer(@click='async () => await setRandomBgNoCache()' title='换一个~')
        IRandom
      a.pointer(
        @click='isShowBgInfo = true'
        style='margin-left: 0.5em'
        title='关于背景'
        v-if='randomBg.info.id'
      )
        IInfoCircle

  NModal(
    :title='`背景图片：${randomBg.info.alt}`'
    closable
    preset='card'
    v-model:show='isShowBgInfo'
  )
    .bg-info-modal
      .align-center
        NuxtLink.thumb(:to='"/artworks/" + randomBg.info.id')
          img(:src='randomBg.info.url || randomBg.url' lazyload)
        .desc
          .author
            NuxtLink(:to='"/users/" + randomBg.info.userId') {{ randomBg.info.userName }}
            | 的作品 (ID: {{ randomBg.info.id }})
        NSpace(justify='center' size='small' style='margin-top: 1rem')
          NTag(
            :key='tag'
            @click='$router.push({ name: "search", params: { keyword: tag, p: 1 } })'
            style='cursor: pointer'
            v-for='tag in randomBg.info.tags'
          ) {{ tag }}

  .body-inner
    section.discover
      NH2 探索发现
      .align-center
        NButton(
          :loading='loadingDiscovery'
          @click='discoveryList.length ? (async () => await setDiscoveryNoCache())() : void 0'
          round
          secondary
          size='small'
        )
          template(#default) {{ loadingDiscovery ? '加载中' : '换一批' }}
          template(#icon): NIcon: IRandom
      ArtworkList(:list='discoveryList', :loading='loadingDiscovery')
</template>

<script lang="ts" setup>
import { formatInTimeZone } from 'date-fns-tz'
import { NH2, NButton, NIcon, NModal, NTag, NSpace } from 'naive-ui'
import IInfoCircle from '~icons/fa-solid/info-circle'
import IRandom from '~icons/fa-solid/random'

useHead({
  title: null,
})

const isShowBgInfo = ref(false)
const discoveryList = ref<ArtworkInfo[]>([])
const siteCache = useSiteCacheStore()
const randomBg = ref<{
  url: string
  info: ArtworkInfo
}>({
  url: '',
  info: {} as ArtworkInfo,
})

const topSliderStyles = computed(() => {
  return { backgroundImage: `url('${randomBg.value.url}')` }
})

async function setRandomBgNoCache(): Promise<void> {
  try {
    const data = await useAjaxResponse<{ illusts: ArtworkInfoOrAd[] }>(
      '/ajax/illust/discovery',
      {
        query: {
          mode: 'safe',
          max: '1',
        },
      }
    )
    const info =
      data.illusts.find((item): item is ArtworkInfo => isArtwork(item)) ??
      defaultArtwork
    const middle = `img/${formatInTimeZone(
      info.updateDate,
      'Asia/Tokyo',
      'yyyy/MM/dd/HH/mm/ss'
    )}/${info.id}`
    const url = `/-/img-master/${middle}_p0_master1200.jpg`
    randomBg.value.info = info
    randomBg.value.url = url
    siteCache.set('home.randomBg', { info, url })
  } catch (err) {
    console.error(err)
  }
}

async function setRandomBgFromCache(): Promise<void> {
  const cache = siteCache.get('home.randomBg')
  if (cache) {
    randomBg.value = cache
  } else {
    await setRandomBgNoCache()
  }
}

const loadingDiscovery = ref(false)
async function setDiscoveryNoCache(): Promise<void> {
  if (loadingDiscovery.value) return
  try {
    loadingDiscovery.value = true
    // discoveryList.value = []
    const data = await useAjaxResponse<{
      illusts: ArtworkInfoOrAd[]
    }>('/ajax/illust/discovery', {
      query: {
        mode: 'all',
        max: '8',
      },
    })
    console.info('setDiscoveryNoCache', data)
    const illusts = data.illusts.filter((item): item is ArtworkInfo =>
      isArtwork(item)
    )
    discoveryList.value = illusts
    siteCache.set('home.discoveryList', illusts)
  } catch (err) {
    console.error('获取探索发现失败', err)
  } finally {
    loadingDiscovery.value = false
  }
}

async function setDiscoveryFromCache(): Promise<void> {
  const cache = siteCache.get('home.discoveryList')
  if (cache) {
    discoveryList.value = cache
    loadingDiscovery.value = false
  } else {
    await setDiscoveryNoCache()
  }
}

onMounted(async () => {
  setRandomBgFromCache()
  setDiscoveryFromCache()
})
</script>

<style lang="sass">
[data-route="index"]
  .top-slider
    min-height: calc(100vh)
    margin-top: -50px
    padding: 30px 10%
    background-position: center
    background-repeat: no-repeat
    background-size: cover
    background-attachment: fixed
    position: relative
    color: #fff
    text-shadow: 0 0 2px #222
    display: flex
    flex-direction: column

    &::before
      content: ''
      display: block
      position: absolute
      top: 0
      left: 0
      width: 100%
      height: 100%
      background-color: rgba(0, 0, 0, 0.2)
      pointer-events: none
      z-index: 0

    > *
      position: relative
      z-index: 1

    .bg-info
      position: absolute
      right: 1.5rem
      bottom: 1rem
      font-size: 1.25rem

      a
        --color: #fff

  .site-logo
    img
      height: 4rem
      width: auto

  .description
    font-size: 1.2rem

  .search-area
    display: flex
    align-items: center

    > *
      width: 100%

  .global-navbar
    background: none
    .search-area
      opacity: 0
      transition: opacity 0.4s ease
      pointer-events: none

    &.not-at-top
      background-color: var(--theme-accent-color)
      .search-area
        opacity: 1
        pointer-events: all

  .bg-info-modal
    .thumb
      > *
        width: auto
        height: auto
        max-width: 100%
        max-height: 60vh
        border-radius: 8px
    .desc
      margin-top: 1rem
      font-size: 0.75rem
      font-style: italic
</style>
