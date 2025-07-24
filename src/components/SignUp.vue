<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center">
    <!-- Background Wave (simplified - Vuetify equivalent or custom if needed) -->
    <!-- For a simple background color, you can apply it to the container or a parent element -->
    <!-- For complex shapes like your current wave, you might need custom CSS or an SVG -->

    <v-card class="pa-8" elevation="2" width="100%" max-width="400">
      <v-card-title class="text-h5 font-weight-bold text-center mb-6">Sign Up</v-card-title>

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

      <v-form @submit.prevent="handleSignUp">
        <v-text-field
          v-model="name"
          label="Name"
          outlined
          dense
          required
          class="mb-4"
          :error-messages="errors.name"
        ></v-text-field>

        <v-text-field
          v-model="phone"
          label="Phone Number"
          outlined
          dense
          required
          class="mb-4"
          :error-messages="errors.phone"
        ></v-text-field>

        <v-text-field
          v-model="email"
          label="Email"
          outlined
          dense
          required
          class="mb-4"
          :error-messages="errors.email"
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Password"
          outlined
          dense
          required
          type="password"
          class="mb-4"
          :error-messages="errors.password"
        ></v-text-field>

        <v-text-field
          v-model="confirmPassword"
          label="Confirm Password"
          outlined
          dense
          required
          type="password"
          class="mb-6"
          :error-messages="errors.confirmPassword"
        ></v-text-field>

        <v-btn
          type="submit"
          color="pink-darken-1"
          large
          block
        >
          Sign Up
        </v-btn>
      </v-form>

      <!-- Sign In Link -->
      <p class="text-center text-body-2 mt-6">
        Already have an Account?
        <router-link to="/login" class="text-pink-darken-1 font-weight-bold text-decoration-none">
          Sign in
        </router-link>
      </p>
    </v-card>
  </v-container>
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
/* Vuetify handles most styling, custom styles can be added here if necessary */
</style>
