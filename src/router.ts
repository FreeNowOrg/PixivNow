import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import index from './view/index.vue'
import indexArtwork from './view/artwork/index.vue'
import viewArtwork from './view/artwork/view.vue'
import users from './view/users.vue'
import error404 from './view/404.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

router.addRoute({
  path: '/',
  component: index,
})
router.addRoute({
  path: '/artworks',
  alias: ['/illust'],
  name: '',
  component: indexArtwork,
})
router.addRoute({
  path: '/artworks/:id',
  alias: ['/illust/:id'],
  name: 'Artworks',
  component: viewArtwork,
})
router.addRoute({
  path: '/users/:id',
  name: 'Users',
  component: users,
})
router.addRoute({
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: error404,
})

export { router }
