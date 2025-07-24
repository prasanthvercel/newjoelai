<template>
  <v-app>
    <v-app-bar app color="pink-darken-1" elevation="1">
      <v-container class="d-flex align-center">
        <v-avatar size="40" rounded="circle">
          <v-img src="/logo.jpg" alt="Logo"></v-img>
        </v-avatar>
        <v-toolbar-title class="ml-3 text-white">Joel Ai</v-toolbar-title>
        <v-spacer></v-spacer>
        <!-- Navigation links can go here if needed before login -->
         <!-- Example: Logout button visible after login -->
         <v-btn v-if="isLoggedIn" text @click="handleLogout" color="white">Logout</v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <!-- Bottom Navigation (conditionally rendered) -->
    <v-bottom-navigation v-if="isLoggedIn" app>
      <v-btn value="home" to="/home">
        <v-icon>mdi-home</v-icon>
        <span>Home</span>
      </v-btn>

      <v-btn value="subscription" to="/subscription">
        <v-icon>mdi-credit-card-outline</v-icon> <!-- Example icon for subscription -->
        <span>Subscription</span>
      </v-btn>

      <v-btn value="profile" to="/profile">
        <v-icon>mdi-account</v-icon>
        <span>Profile</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from './supabase'; // Assuming supabase is initialized here or accessible

const isLoggedIn = ref(false);
const router = useRouter();

// Watch for changes in authentication state and update isLoggedIn
watchEffect(() => {
  const user = supabase.auth.user(); // Or however you get the current user
  isLoggedIn.value = !!user; // isLoggedIn is true if user exists, false otherwise

  // Optional: Redirect to login if not logged in and not already on a public page
  if (!isLoggedIn.value && router.currentRoute.value.meta.requiresAuth) {
     router.push('/login'); // Adjust login route as needed
  }
});

// Handle initial auth state on app load
onMounted(async () => {
  const user = supabase.auth.user(); // Or however you get the current user
  isLoggedIn.value = !!user;
});

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('User logged out');
    router.push('/login'); // Redirect to login page after logout
  } catch (error) {
    console.error('Error logging out:', error.message);
    // Optionally show an error message to the user
  }
};

</script>

<style scoped>
/* Optional styles for the bottom navigation */
</style>
