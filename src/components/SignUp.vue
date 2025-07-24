<template>
  <div class="auth-container">
    <h2 class="auth-title">Sign Up to Joel AI</h2>
    <form @submit.prevent="handleSignUp" class="auth-form">
      <div class="form-group">
        <label for="email" class="form-label">Email:</label>
        <input type="email" id="email" v-model="email" required class="form-input" />
        <span v-if="emailError" class="error-message">{{ emailError }}</span>
      </div>
      <div class="form-group">
        <label for="password" class="form-label">Password:</label>
        <input type="password" id="password" v-model="password" required class="form-input" />
        <span v-if="passwordError" class="error-message">{{ passwordError }}</span>
      </div>
      <button type="submit" class="auth-button">Sign Up</button>
    </form>
    <p class="auth-link">Already have an account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const emailError = ref('');
const passwordError = ref('');
const router = useRouter();

const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/.test(email)) return 'Invalid email format';
  return '';
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return '';
};

const handleSignUp = async () => {
  emailError.value = validateEmail(email.value);
  passwordError.value = validatePassword(password.value);

  if (emailError.value || passwordError.value) return;

  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    alert('Signed up successfully! Please check your email to confirm.');
    router.push('/login');
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

.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 5px;
  display: block;
}

.auth-button {
  width: 100%;
  padding: 10px;
  background-color: #5cb85c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

.auth-button:hover {
  background-color: #4cae4c;
}

.auth-link {
  margin-top: 20px;
  color: #555;
}

.auth-link a {
  color: #5cb85c;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>