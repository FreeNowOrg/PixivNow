export default defineNuxtRouteMiddleware((to) => {
  // Legacy search URLs → new query-based /search
  //   /search/:keyword            → /search?q=:keyword
  //   /search/:keyword/:page      → /search?q=:keyword&p=:page
  // Old `content` query param is renamed to `type`; other filter params pass through.
  const m = to.path.match(/^\/search\/([^/]+)(?:\/([^/]+))?\/?$/)
  if (m) {
    const keyword = decodeURIComponent(m[1])
    const page = m[2]
    const query: Record<string, string> = {
      ...(to.query as Record<string, string>),
    }
    if (query.content) {
      query.type = query.content
      delete query.content
    }
    query.q = keyword
    if (page && page !== '1') {
      query.p = page
    } else {
      delete query.p
    }
    return navigateTo({ path: '/search', query }, { redirectCode: 302 })
  }
})
