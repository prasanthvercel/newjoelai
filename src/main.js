import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';
import SignUp from './components/SignUp.vue';
import Login from './components/Login.vue';
import Home from './components/Home.vue';
import ForgotPassword from './components/ForgotPassword.vue';
import Welcome from './components/Welcome.vue'; // Import the new Welcome component
import { supabase } from './supabase';
import '@mdi/font/css/materialdesignicons.css';

// Import Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const routes = [
  { path: '/signup', component: SignUp },
  { path: '/login', component: Login },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/home', component: Home, meta: { requiresAuth: true } },
  { path: '/', component: Welcome } // Set Welcome as the default route
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // Redirect to login if authentication is required and no session exists
  if (requiresAuth && !session) {
    next('/login');
  // Allow access to Welcome, Login, and ForgotPassword pages even without authentication
  } else if (['/', '/login', '/forgot-password', '/signup'].includes(to.path)) {
    next();
  }  else {
    next();
  }
});

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
  // Add any desired configuration here (e.g., theme, icons)
})

createApp(App).use(router).use(vuetify).mount('#app');



