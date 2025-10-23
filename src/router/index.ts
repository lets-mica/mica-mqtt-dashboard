import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('@/views/Clients.vue'),
        meta: { title: '客户端管理' }
      },
      {
        path: 'clients/:clientId',
        name: 'ClientDetail',
        component: () => import('@/views/ClientDetail.vue'),
        meta: { title: '客户端详情' }
      },
      {
        path: 'monitor',
        name: 'Monitor',
        component: () => import('@/views/Monitor.vue'),
        meta: { title: '状态监控' }
      },
      {
        path: 'debug',
        name: 'Debug',
        component: () => import('@/views/Debug.vue'),
        meta: { title: 'MQTT 调试' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
