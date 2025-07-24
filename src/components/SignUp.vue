<template>
  <div class="relative min-h-screen bg-gray-100 flex flex-col justify-center items-center overflow-hidden">
    <!-- Background Wave -->
    <div class="absolute top-0 left-0 w-full h-1/2 bg-pink-300" style="clip-path: ellipse(100% 55% at 48% 45%);"></div>

    <div class="relative z-10 bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Sign Up</h2>

      <!-- Toast Notification -->
      <div v-if="toast.message" :class="['p-3 mb-4 text-sm rounded-md', toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800']" role="alert">
        {{ toast.message }}
      </div>

      <form @submit.prevent="handleSignUp">
        <div class="mb-4">
          <label for="name" class="block text-gray-700 text-sm font-bold mb-2">Name</label>
          <input
            type="text"
            id="name"
            v-model="name"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your name"
          />
          <span v-if="errors.name" class="text-red-500 text-xs italic">{{ errors.name }}</span>
        </div>
        <div class="mb-4">
          <label for="phone" class="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
          <input
            type="tel"
            id="phone"
            v-model="phone"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your phone number"
          />
           <span v-if="errors.phone" class="text-red-500 text-xs italic">{{ errors.phone }}</span>
        </div>
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
        <div class="mb-4">
          <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your password"
          />
          <span v-if="errors.password" class="text-red-500 text-xs italic">{{ errors.password }}</span>
        </div>
         <div class="mb-6">
          <label for="confirm-password" class="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            v-model="confirmPassword"
            required
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Confirm your password"
          />
           <span v-if="errors.confirmPassword" class="text-red-500 text-xs italic">{{ errors.confirmPassword }}</span>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="submit"
            class="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Sign Up
          </button>
        </div>
      </form>

      <!-- Sign In Link -->
      <p class="text-center text-gray-600 text-xs mt-6">
        Already have an Account? 
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

const name = ref('');
const phone = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

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

  if (!name.value) {
    errors.value.name = 'Name is required';
  }
  if (!phone.value) {
    errors.value.phone = 'Phone number is required';
  }
  if (!email.value) {
    errors.value.email = 'Email is required';
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/.test(email.value)) {
    errors.value.email = 'Invalid email format';
  }
  if (!password.value) {
    errors.value.password = 'Password is required';
  } else if (password.value.length < 6) {
    errors.value.password = 'Password must be at least 6 characters long';
  }
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Confirm password is required';
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSignUp = async () => {
  if (!validateForm()) {
    showToast('Please fix the errors in the form', 'error');
    return;
  }

  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { // You can add user metadata here if your Supabase schema supports it
        data: {
          name: name.value,
          phone: phone.value,
        }
      }
    });
    if (error) throw error;
    
    showToast('Signed up successfully! Please check your email to confirm.', 'success');
    router.push('/login'); // Redirect to login after successful sign up
  } catch (error) {
    showToast(error.message, 'error');
  }
};
</script>

<style scoped>
/* Tailwind classes are used for styling, no custom styles needed here */
</style>
