import { createRouter, createWebHistory } from 'vue-router'
import BangumiTable from '@/views/BangumiTable.vue'
import BangumiCards from '@/views/BangumiCards.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/bangumi/table'
    },
    {
      path: '/bangumi/table',
      name: 'BangumiTable',
      component: BangumiTable
    },
    {
      path: '/bangumi/card',
      name: 'BangumiCards',
      component: BangumiCards
    }
  ]
})

export default router
