import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import index from './view/index.vue'
import indexArtwork from './view/indexArtwork.vue'
import viewArtwork from './view/viewArtwork.vue'
import users from './view/users.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [],
})

router.addRoute({
  path: '/',
  component: index,
})
router.addRoute({
  path: '/artworks',
  name: '',
  component: indexArtwork,
})
router.addRoute({
  path: '/artworks/:id',
  name: 'Artworks',
  component: viewArtwork,
})
router.addRoute({
  path: '/users/:id',
  name: 'Users',
  component: users,
})

export { router }
