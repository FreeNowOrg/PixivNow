import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
  scrollBehavior(to, from) {
    if (to === from) return
    return { top: 0 }
  },
})

// Home
router.addRoute({
  path: '/',
  name: 'home',
  component: () => import('./view/index.vue'),
})

// Illust
router.addRoute({
  path: '/artworks/:id',
  alias: ['/illust/:id', '/i/:id'],
  name: 'artworks',
  component: () => import('./view/artworks.vue'),
})

// User
router.addRoute({
  path: '/users/:id',
  name: 'users',
  alias: ['/u/:id'],
  component: () => import('./view/users.vue'),
})

// Search
router.addRoute({
  path: '/search/:keyword',
  name: 'search-index-redirect',
  redirect: (to) => `/search/${to.params.keyword}/1`,
})
router.addRoute({
  path: '/search/:keyword/:p',
  name: 'search',
  component: () => import('./view/search.vue'),
})

// Ranking
router.addRoute({
  path: '/ranking',
  name: 'ranking',
  component: () => import('./view/ranking.vue'),
})

// Ranking
router.addRoute({
  path: '/login',
  name: 'user-login',
  component: () => import('./view/login.vue'),
})

// About
router.addRoute({
  path: '/about',
  name: 'about-us',
  component: () => import('./view/about.vue'),
})

// 404
router.addRoute({
  path: '/:pathMatch(.*)*',
  name: 'not-found',
  component: () => import('./view/404.vue'),
})

router.afterEach(({ name }) => {
  document.body.setAttribute('data-route', name as string)
  // Fix route when modal opened
  document.body.style.overflow = 'visible'
})

router.onError((error, to, from) => console.log(error, to, from))

export { router }
