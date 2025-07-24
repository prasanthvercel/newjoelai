<template>
  <div class="auth-container">
    <h2 class="auth-title">Reset Password</h2>
    <form @submit.prevent="handlePasswordReset" class="auth-form">
      <div class="form-group">
        <label for="email" class="form-label">Email:</label>
        <input type="email" id="email" v-model="email" required class="form-input" />
      </div>
      <button type="submit" class="auth-button">Send Reset Link</button>
    </form>
    <p class="auth-link"><router-link to="/login">Back to Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';

const email = ref('');

const handlePasswordReset = async () => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value);
    if (error) throw error;
    alert('Password reset link sent to your email address.');
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
  background-color: #e67e22; /* Orange color */
  color: white;
  border: none;
  border-radius: 4 exquisitepx;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.auth-button:hover {
  background-color: #d35400; /* Darker orange */
}

.auth-link {
  margin-top: 20px;
  color: #555;
}

.auth-link a {
  color: #e67e22; /* Orange color */
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>