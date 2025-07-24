<template>
  <div class="home-container">
    <h1 class="home-title">Welcome to Joel AI!</h1>
    <p class="home-subtitle">Your AI companion.</p>
    <button @click="handleLogout" class="logout-button">Logout</button>
  </div>
</template>

<script setup>
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/login'); // Redirect to login page after logout
  } catch (error) {
    alert(error.message);
  }
};
</script>

<style>
/* Removed 'scoped' attribute */
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #e0f7fa; /* Light blue background */
  padding: 20px;
  text-align: center;
}

.home-title {
  color: #00796b; /* Teal color */
  margin-bottom: 15px;
}

.home-subtitle {
  color: #004d40; /* Darker teal */
  margin-bottom: 30px;
}

.logout-button {
  padding: 10px 20px;
  background-color: #d32f2f; /* Red color */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.logout-button:hover {
  background-color: #c62828; /* Darker red */
}
</style>