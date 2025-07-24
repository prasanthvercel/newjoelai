<template>
  <v-container fluid class="fill-height d-flex flex-column align-center" style="padding-bottom: 56px;">
    <v-card class="pa-6 text-center" flat>
      <v-card-title class="text-h4 font-weight-bold mb-4">English Practice AI</v-card-title>
      <v-card-text>
        <p class="text-subtitle-1 mb-4">Start practicing your English speaking skills with our AI.</p>

        <!-- AI interaction area (Scrollable Chat) -->
        <div class="ai-interaction-area mb-6" ref="chatArea">
          <div v-for="(message, index) in conversationHistory" :key="index" :class="{'d-flex justify-end': message.sender === 'user', 'd-flex justify-start': message.sender === 'ai'}" class="mb-4">
            <v-chip
              :color="message.sender === 'user' ? 'primary' : 'grey'"
              label
              large
              class="pa-4"
              :class="{'rounded-br-0': message.sender === 'user', 'rounded-bl-0': message.sender === 'ai'}"
            >
              {{ message.text }}
            </v-chip>
          </div>
          <div v-if="loading" class="d-flex justify-start mb-4">
            <v-progress-circular indeterminate size="30" width="3" color="grey"></v-progress-circular>
          </div>
        </div>

        <!-- Input and Send -->
        <div class="d-flex align-center">
          <v-text-field
            v-model="userInput"
            label="Type your English sentence..."
            outlined
            rounded
            dense
            hide-details
            class="mr-2"
            @keyup.enter="sendMessage"
          ></v-text-field>
          <v-btn color="primary" @click="sendMessage" :disabled="!userInput || loading">
            <v-progress-circular
              v-if="loading"
              indeterminate
              size="20"
              width="2"
              color="white"
              class="mr-2"
            ></v-progress-circular>
            Send
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Logout Button -->
    <v-btn color="error" @click="handleLogout" class="mt-6">Logout</v-btn>
  </v-container>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const router = useRouter();

const userInput = ref('');
const conversationHistory = ref([]);
const loading = ref(false); // To indicate when the API call is in progress
const chatArea = ref(null); // Ref for the chat area element

// ** REPLACE WITH YOUR ACTUAL GEMINI API KEY (NOT SECURE FOR PRODUCTION)**
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
// ** REPLACE WITH THE CORRECT GEMINI API ENDPOINT**
const GEMINI_API_ENDPOINT = 'YOUR_GEMINI_API_ENDPOINT';

const scrollToBottom = () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight;
    }
  });
};

const callGeminiApi = async (message, history, retries = 3) => {
  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`, // Or whatever authentication Gemini API uses
      },
      body: JSON.stringify({
        // Include user input and conversation history in the request body
        // Refer to Gemini API documentation for the correct request format
        prompt: message,
        history: history.map(msg => ({ role: msg.sender, parts: [{ text: msg.text }] })),
      }),
    });

    if (!response.ok) {
      if (retries > 0) {
        console.warn(`API request failed with status ${response.status}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        return callGeminiApi(message, history, retries - 1); // Retry the call
      }
      throw new Error(`API request failed after multiple retries with status ${response.status}`);
    }

    const responseData = await response.json();
    return responseData.text || responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: Could not get AI response.'; // Adjust based on Gemini API response structure

  } catch (error) {
    if (retries > 0) {
      console.warn(`API request failed: ${error}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      return callGeminiApi(message, history, retries - 1); // Retry the call
    }
    throw new Error(`API request failed after multiple retries: ${error}`);
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return;

  loading.value = true; // Set loading to true

  const message = userInput.value;
  conversationHistory.value.push({ text: message, sender: 'user' });
  userInput.value = '';
  scrollToBottom();

  try {
    const aiResponse = await callGeminiApi(message, conversationHistory.value);
    conversationHistory.value.push({ text: aiResponse, sender: 'ai' });

  } catch (error) {
    console.error('Error sending message to Gemini API:', error);
    conversationHistory.value.push({ text: 'Error: Could not connect to AI.', sender: 'ai' });
  } finally {
    loading.value = false; // Set loading to false regardless of success or failure
    scrollToBottom();
  }
};

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

<style scoped>
.ai-interaction-area {
  width: 100%;
  height: 300px; /* Adjust height as needed */
  padding: 10px;
  overflow-y: auto; /* Make the chat area scrollable */
  display: flex;
  flex-direction: column;
}

.ai-interaction-area > div {
  width: fit-content; /* Adjust width based on content */
  max-width: 80%; /* Limit maximum width */
}
</style>
