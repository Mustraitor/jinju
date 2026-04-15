import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import player from "../components/player.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/admin',
      component: () => import('@/views/AdminPage.vue'),
      meta: { requiresAuth: true,
              requiresAdmin: true 
            }
    },
    {
      path:'/home',
      component: () =>  import ('@/views/HomePage.vue'),
      meta: { requiresAuth: true } 
    },
    {
      path:'/login',
      component: () =>  import ('@/views/LoginPage.vue'),
      meta: { requiresAuth: false } 
    }, 
    {
      path: '/music',
      component: () => import ('@/views/MusicPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path:'/chatAI',
      component: () => import('@/views/ChatPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path:'/video',
      component: () => import('@/views/VideoPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/player/:id",
      name: "Player",
      component: () => import('@/components/player.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: "/graph",
      component: () => import('@/views/GraphPage.vue'),
      meta: { requiresAuth: true }
    }
  ],
})
// 全局路由守卫
router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.path === '/') {
    // 根据 token 是否有效来决定去向
    return (userStore.token && userStore.isTokenValid) ? '/home' : '/login'
  }
 
  if (!userStore.isTokenValid && userStore.token) {
    userStore.removeToken()
    return '/login'
  }

  if (to.meta.requiresAuth) {
    if (!userStore.token || !userStore.isTokenValid) {
      return '/login'
    }
  }
  if (to.meta.requiresAdmin) {
      // 检查 userStore 里的权限位
      if (userStore.user_type !== 1) {
        // 如果不是管理员，拦截并重定向到首页
        ElMessage.warning('您没有权限访问管理后台')
        if (from.path === '/' || from.path === to.path) {
          return '/home'
        } else {
          return false // 中止本次跳转，用户停留在当前页面
        }
      }
  }
})




export default router
