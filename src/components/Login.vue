<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center">
    <!-- Background Wave (simplified - Vuetify equivalent or custom if needed) -->
    <!-- For a simple background color, you can apply it to the container or a parent element -->
    <!-- For complex shapes like your current wave, you might need custom CSS or an SVG -->

    <v-card class="pa-8" elevation="2" width="100%" max-width="400">
      <v-card-title class="text-h5 font-weight-bold text-center mb-6">Sign in</v-card-title>

      <!-- Toast Notification -->
      <v-alert
        v-if="toast.message"
        :type="toast.type"
        dense
        closable
        class="mb-4"
      >
        {{ toast.message }}
      </v-alert>

      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="email"
          label="Email"
          outlined
          dense
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Password"
          outlined
          dense
          required
          type="password"
          class="mb-2"
        ></v-text-field>

        <!-- Forgot Password and Remember Me -->
        <div class="d-flex justify-space-between align-center text-caption mb-6">
          <v-checkbox
            label="Remember Me"
            dense
            hide-details
          ></v-checkbox>
          <router-link to="/forgot-password" class="text-pink-darken-1 font-weight-bold text-decoration-none">
            Forgot Password?
          </router-link>
        </div>

        <v-btn
          type="submit"
          color="pink-darken-1"
          large
          block
        >
          Login
        </v-btn>
      </v-form>

      <!-- Sign Up Link -->
      <p class="text-center text-body-2 mt-6">
        Don't have an Account?
        <router-link to="/signup" class="text-pink-darken-1 font-weight-bold text-decoration-none">
          Sign up
        </router-link>
      </p>
    </v-card>
  </v-container>
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
/* Vuetify handles most styling, custom styles can be added here if necessary */
</style>