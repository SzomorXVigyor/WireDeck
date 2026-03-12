import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ViewPage from '../views/ViewPage.vue';
import RegisterDictionaryPage from '../views/RegisterDictionaryPage.vue';
import DevicesPage from '../views/DevicesPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'view/:id',
        name: 'ViewDetail',
        component: ViewPage,
      },
      {
        path: 'registers',
        name: 'RegisterDictionary',
        component: RegisterDictionaryPage,
        meta: { requiresAdmin: true },
      },
      {
        path: 'devices',
        name: 'Devices',
        component: DevicesPage,
        meta: { requiresAdmin: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
