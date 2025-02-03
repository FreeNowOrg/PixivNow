import { defineStore } from 'pinia'

export type SiteCacheKey = string | number

export const useSiteCacheStore = defineStore('siteCache', () => {
  const siteCacheData = ref(new Map<SiteCacheKey, any>())
  function get(key: SiteCacheKey) {
    const value = siteCacheData.value.get(key)
    console.log('getCache', key, value)
    return value
  }
  function set(key: SiteCacheKey, value: any) {
    console.log('setCache', key, value)
    siteCacheData.value.set(key, value)
  }
  return {
    get,
    set,
  }
})
