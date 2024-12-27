import { defineStore } from 'pinia'

export const useSiteCacheStore = defineStore('siteCache', () => {
  const siteCacheData = ref(new Map<string | number, any>())
  function get(key: string | number) {
    const value = siteCacheData.value.get(key)
    console.log('getCache', key, value)
    return value
  }
  function set(key: string | number, value: any) {
    console.log('setCache', key, value)
    siteCacheData.value.set(key, value)
  }
  return {
    get,
    set,
  }
})
