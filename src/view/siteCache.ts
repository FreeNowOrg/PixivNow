const _siteCacheData = new Map<string | number, any>()
export function setCache(key: string | number, val: any) {
  console.log('setCache', key, val)
  _siteCacheData.set(key, val)
}
export function getCache(key: string | number) {
  const val = _siteCacheData.get(key)
  console.log('getCache', key, val)
  return val
}
