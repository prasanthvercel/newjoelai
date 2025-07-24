import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';
import SignUp from './components/SignUp.vue';
import Login from './components/Login.vue';
import Home from './components/Home.vue';
import ForgotPassword from './components/ForgotPassword.vue';
import { supabase } from './supabase';

const routes = [
  { path: '/signup', component: SignUp },
  { path: '/login', component: Login },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/', redirect: '/signup' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !session) {
    next('/login');
  } else {
    next();
  }
});

createApp(App).use(router).mount('#app');
