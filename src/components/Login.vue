<template>
  <div class="relative min-h-screen bg-gray-100 flex flex-col justify-center items-center overflow-hidden">
    <!-- Background Wave -->
    <div class="absolute top-0 left-0 w-full h-1/2 bg-pink-300" style="clip-path: ellipse(100% 55% at 48% 45%);"></div>

    <div class="relative z-10 bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Sign in</h2>

      <!-- Toast Notification -->
      <div v-if="toast.message" :class="['p-3 mb-4 text-sm rounded-md', toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']" role="alert">
        {{ toast.message }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="i.e. demo@email.com"
          />
        </div>
        <div class="mb-6">
          <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your password"
          />
          <!-- Forgot Password Link -->
          <div class="flex justify-between items-center text-sm">
            <label class="flex items-center">
              <input type="checkbox" class="form-checkbox">
              <span class="ml-2 text-gray-600">Remember Me</span>
            </label>
             <router-link to="/forgot-password" class="inline-block align-baseline font-bold text-sm text-pink-500 hover:text-pink-800">
              Forgot Password?
            </router-link>
          </div>

        </div>
        <div class="flex items-center justify-between">
          <button
            type="submit"
            class="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Login
          </button>
        </div>
      </form>

      <!-- Sign Up Link -->
      <p class="text-center text-gray-600 text-xs mt-6">
        Don't have an Account? 
        <router-link to="/signup" class="inline-block align-baseline font-bold text-sm text-pink-500 hover:text-pink-800">
          Sign up
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

// Simple toast notification state
const toast = ref({
  message: '',
  type: '' // 'success' or 'error'
});

const showToast = (message, type) => {
  toast.value.message = message;
  toast.value.type = type;
  setTimeout(() => {
    toast.value.message = '';
    toast.value.type = '';
  }, 3000); // Hide toast after 3 seconds
};

const handleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    
    showToast('Logged in successfully!', 'success');
    router.push('/home'); // Redirect to home page after successful login
  } catch (error) {
    showToast(error.message, 'error');
  }
};
</script>

<style scoped>
/* Tailwind classes are used for styling, no custom styles needed here */
</style>
