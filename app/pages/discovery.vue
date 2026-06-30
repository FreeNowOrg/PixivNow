<template lang="pug">
#discovery-view.body-inner
  .discover-header
    h2
      FnbIcon: ITablerCompass
      |  探索发现
    .discover-controls
      .tab-nav
        RouterLink.tab-item(
          v-for='t in tabs',
          :key='t.key',
          :to='t.to',
          :class='{ active: activeKey === t.key }'
        ) {{ t.label }}
      FnbSelect(
        v-if='showModeSelect && userStore.isLoggedIn',
        :model-value='discoveryMode',
        :options='discoveryModeOptions',
        @update:model-value='changeMode'
      )
      FnbButton(:loading='isLoading', @click='refresh', size='sm')
        template(#icon): IFasRandom
        | {{ isLoading ? '加载中' : '换一批' }}
  NuxtPage
</template>

<script lang="ts" setup>
import IFasRandom from '~icons/fa-solid/random'
import { IconCompass as ITablerCompass } from '@tabler/icons-vue'
import { useDiscoveryStore } from '~/stores/discovery'
import { useUserStore } from '~/stores/session'
import { setTitle } from '~/utils/setTitle'

definePageMeta({ name: 'discovery' })

const discoveryStore = useDiscoveryStore()
const userStore = useUserStore()
const route = useRoute()

const discoveryModeOptions = [
  { label: '混池', value: 'all' },
  { label: '全年龄', value: 'safe' },
  { label: 'R18', value: 'r18' },
]

const savedDiscoveryMode = useLocalStorage('pixivnow:discovery-mode', 'all')
const discoveryMode = ref(savedDiscoveryMode.value)
discoveryStore.discoveryMode = discoveryMode.value

const tabs = [
  { key: 'artworks', label: '插画·漫画', to: '/discovery/artworks' },
  { key: 'novels', label: '小说', to: '/discovery/novels' },
  { key: 'users', label: '用户', to: '/discovery/users' },
]

const activeKey = computed(() => {
  if (route.path.startsWith('/discovery/novels')) return 'novels'
  if (route.path.startsWith('/discovery/users')) return 'users'
  return 'artworks'
})

const showModeSelect = computed(() => activeKey.value !== 'users')

const isLoading = computed(() => {
  if (activeKey.value === 'novels') return discoveryStore.loadingNovelDiscovery
  if (activeKey.value === 'users') return discoveryStore.loadingUserDiscovery
  return discoveryStore.loadingDiscovery
})

function refresh() {
  if (activeKey.value === 'novels') discoveryStore.fetchNovelDiscovery()
  else if (activeKey.value === 'users') discoveryStore.fetchUserDiscovery()
  else discoveryStore.fetchDiscovery()
}

function changeMode(mode: string) {
  discoveryMode.value = mode
  savedDiscoveryMode.value = mode
  discoveryStore.discoveryMode = mode
  refresh()
}

onMounted(() => setTitle('探索发现'))
</script>

<style lang="scss" scoped>
#discovery-view {
  margin-top: 1.5rem;
}

.discover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;

  h2 {
    font-family: var(--fnb-font-display);
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }
}

.discover-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tab-nav {
  display: flex;
  gap: 0.25rem;
}

.tab-item {
  padding: 0.3rem 1rem;
  border: 3px solid transparent;
  border-radius: var(--fnb-radius-sm);
  font-weight: 700;
  color: var(--fnb-text-muted);
  text-decoration: none;
  transition: color 150ms, background 150ms;

  &:hover {
    color: var(--fnb-text);
    background: color-mix(in srgb, var(--fnb-brand) 15%, var(--fnb-surface));
  }

  &.active {
    color: var(--fnb-on-brand);
    background: var(--fnb-brand);
    border-color: var(--fnb-border);
  }
}
</style>
