<template>
  <div class="auth-container">
    <h2 class="auth-title">Login to Joel AI</h2>
    <form @submit.prevent="handleLogin" class="auth-form">
      <div class="form-group">
        <label for="email" class="form-label">Email:</label>
        <input type="email" id="email" v-model="email" required class="form-input" />
      </div>
      <div class="form-group">
        <label for="password" class="form-label">Password:</label>
        <input type="password" id="password" v-model="password" required class="form-input" />
      </div>
      <button type="submit" class="auth-button">Login</button>
    </form>
    <p class="auth-link">Don't have an account? <router-link to="/signup">Sign Up</router-link></p>
    <p class="auth-link"><router-link to="/forgot-password">Forgot Password?</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    alert('Logged in successfully!');
    router.push('/home'); // Redirect to home page after successful login
  } catch (error) {
    alert(error.message);
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f4f4f4;
  padding: 20px;
}

.auth-title {
  margin-bottom: 30px;
  color: #333;
}

.auth-form {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.auth-button {
  width: 100%;
  padding: 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.auth-button:hover {
  background-color: #2980b9;
}

.auth-link {
  margin-top: 20px;
  color: #555;
}

.auth-link a {
  color: #3498db;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>