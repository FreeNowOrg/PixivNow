import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

// Home
router.addRoute({
  path: '/',
  name: 'home',
  component: () => import('./view/index.vue'),
})

// Illust index
router.addRoute({
  path: '/artworks',
  alias: ['/illust', '/i'],
  name: 'artworks-index',
  component: () => import('./view/artwork/index.vue'),
})
// Illust view
router.addRoute({
  path: '/artworks/:id',
  alias: ['/illust/:id', '/i/:id'],
  name: 'artworks-view',
  component: () => import('./view/artwork/view.vue'),
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

export { router }
