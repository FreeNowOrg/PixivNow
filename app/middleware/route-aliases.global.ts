export default defineNuxtRouteMiddleware((to) => {
  // /search/:keyword → /search/:keyword/1
  const searchMatch = to.path.match(/^\/search\/([^/]+)$/)
  if (searchMatch) {
    return navigateTo(`/search/${searchMatch[1]}/1`, { redirectCode: 302 })
  }
})
