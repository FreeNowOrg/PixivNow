import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

router.addRoute({
  path: '/',
  component: () => import('./view/index.vue'),
})
router.addRoute({
  path: '/artworks',
  alias: ['/illust'],
  name: '',
  component: () => import('./view/artwork/index.vue'),
})
router.addRoute({
  path: '/artworks/:id',
  alias: ['/illust/:id'],
  name: 'Artworks',
  component: () => import('./view/artwork/view.vue'),
})
router.addRoute({
  path: '/users/:id',
  name: 'Users',
  component: () => import('./view/users.vue'),
})
router.addRoute({
  path: '/search/:keyword',
  name: 'search',
  component: () => import('./view/search.vue'),
})

// 404
router.addRoute({
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('./view/404.vue'),
})

export { router }
