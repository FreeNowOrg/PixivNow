import { ref } from 'vue'

export const _siteCacheData = ref()
_siteCacheData.value = {}
export function setCache(key: string, val: any) {
  console.log('setCache', key, val)
  _siteCacheData.value[key] = val
}
export function getCache(key: number | string) {
  console.log('getCache', key, _siteCacheData.value[key])
  return _siteCacheData.value[key] || null
}
