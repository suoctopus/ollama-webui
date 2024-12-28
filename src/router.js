import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('./views/ChatView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./views/SettingsView.vue')
  },
  {
    path: '/models',
    name: 'Models',
    component: () => import('./views/ModelsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 