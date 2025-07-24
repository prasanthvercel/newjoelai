<template>
  <div class="relative min-h-screen bg-gray-100 flex flex-col justify-center items-center overflow-hidden">
    <!-- Background Wave -->
    <div class="absolute top-0 left-0 w-full h-1/2 bg-pink-300" style="clip-path: ellipse(100% 55% at 48% 45%);"></div>

    <div class="relative z-10 bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>

       <!-- Toast Notification -->
      <div v-if="toast.message" :class="['p-3 mb-4 text-sm rounded-md', toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']" role="alert">
        {{ toast.message }}
      </div>

      <form @submit.prevent="handleForgotPassword">
        <div class="mb-4">
          <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your email"
          />
           <span v-if="errors.email" class="text-red-500 text-xs italic">{{ errors.email }}</span>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="submit"
            class="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Send Reset Email
          </button>
        </div>
      </form>

      <!-- Back to Login Link -->
      <p class="text-center text-gray-600 text-xs mt-6">
        Remember your password? 
        <router-link to="/login" class="inline-block align-baseline font-bold text-sm text-pink-500 hover:text-pink-800">
          Sign in
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

// Simple validation errors state
const errors = ref({});

const validateForm = () => {
  errors.value = {}; // Clear previous errors

  if (!email.value) {
    errors.value.email = 'Email is required';
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/.test(email.value)) {
    errors.value.email = 'Invalid email format';
  }

  return Object.keys(errors.value).length === 0;
};

const handleForgotPassword = async () => {
   if (!validateForm()) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: window.location.origin + '/update-password' // Redirect to a page where the user can update their password
    });

    if (error) throw error;

    showToast('Password reset email sent! Check your inbox.', 'success');
    // Optionally redirect to a confirmation page
    // router.push('/forgot-password-confirmation');

  } catch (error) {
    showToast(error.message, 'error');
  }
};
</script>

<style scoped>
/* Tailwind classes are used for styling, no custom styles needed here */
</style>