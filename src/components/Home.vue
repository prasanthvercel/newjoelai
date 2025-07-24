<template>
  <v-container fluid class="fill-height d-flex flex-column justify-space-between align-center pa-0">
    <!-- Top Section (Optional - for status or settings) -->
    <div class="top-section text-center pa-4">
      <!-- Could include status indicators, settings icons, etc. -->
    </div>

    <!-- AI Interaction Area (Main conversational display) -->
    <div class="ai-interaction-area flex-grow-1 d-flex flex-column overflow-y-auto pa-4" ref="chatArea">
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

    <!-- Input and Controls Area (Bottom Section) -->
    <div class="input-controls-area d-flex align-center pa-4">
      <!-- Voice Input Button -->
      <v-btn icon color="primary" large class="mr-2" @click="toggleListening">
        <v-icon>{{ isListening ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
      </v-btn>

      <!-- Text Input (Optional, if you still want text input) -->
      <v-text-field
        v-model="userInput"
        label="Type your English sentence or speak..."
        outlined
        rounded
        dense
        hide-details
        class="flex-grow-1"
        @keyup.enter="sendMessage"
        :disabled="loading || isListening"
      ></v-text-field>

      <!-- Send Button (for text input) -->
      <v-btn color="primary" @click="sendMessage" :disabled="!userInput || loading || isListening" class="ml-2">
        Send
      </v-btn>

      <!-- Placeholder for other controls (e.g., settings, clear) -->
      <!-- <v-btn icon color="grey darken-2" large class="ml-2">
        <v-icon>mdi-settings</v-icon>
      </v-btn> -->
    </div>

    <!-- Logout Button (can be placed elsewhere depending on final design) -->
    <!-- <v-btn color="error" @click="handleLogout" class="mt-6">Logout</v-btn> -->
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

const router = useRouter();

const userInput = ref('');
const conversationHistory = ref([]);
const loading = ref(false); // To indicate when the API call is in progress
const chatArea = ref(null); // Ref for the chat area element

// Voice Assistant State
const isListening = ref(false);
const recognition = ref(null);
const utterance = ref(null);

// ** REPLACE WITH YOUR ACTUAL GEMINI API KEY (NOT SECURE FOR PRODUCTION)**
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// ** Hardcoded Gemini API Endpoint for text-based chat**
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const scrollToBottom = () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight;
    }
  });
};

const callGeminiApi = async (message, history, retries = 3) => {
  // ... (rest of the callGeminiApi function remains the same)
  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY, // Use x-goog-api-key for API key authentication
      },
      body: JSON.stringify({
        contents: history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model', // Map 'user' to 'user', 'ai' to 'model'
          parts: [{ text: msg.text }],
        })),
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
    // Adjust response parsing based on the actual Gemini API response structure
    const aiResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: Could not get AI response.';

    return aiResponse;

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
    speakText(aiResponse); // Speak the AI response

  } catch (error) {
    console.error('Error sending message to Gemini API:', error);
    conversationHistory.value.push({ text: 'Error: Could not connect to AI.', sender: 'ai' });
  } finally {
    loading.value = false; // Set loading to false regardless of success or failure
    scrollToBottom();
  }
};

// Web Speech API Functions
const initializeSpeechRecognition = () => {
  if (!('webkitSpeechRecognition' in window)) {
    console.error('Web Speech API is not supported by this browser.');
    return;
  }

  recognition.value = new webkitSpeechRecognition();
  recognition.value.continuous = false; // Set to true for continuous listening
  recognition.value.interimResults = false; // Set to true to get interim results
  recognition.value.lang = 'en-US'; // Set the language

  recognition.value.onstart = () => {
    isListening.value = true;
    console.log('Speech recognition started.');
  };

  recognition.value.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript; // Put transcript in the text input
    console.log('Speech recognized:', transcript);
    // You might want to automatically send the message after recognition stops
    sendMessage();
  };

  recognition.value.onerror = (event) => {
    isListening.value = false;
    console.error('Speech recognition error:', event.error);
  };

  recognition.value.onend = () => {
    isListening.value = false;
    console.log('Speech recognition ended.');
  };
};

const toggleListening = () => {
  if (isListening.value) {
    recognition.value.stop();
  } else {
    recognition.value.start();
  }
};

const speakText = (text) => {
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech is not supported by this browser.');
    return;
  }

  utterance.value = new SpeechSynthesisUtterance(text);
  // You can customize voice, pitch, rate, etc. here
  // utterance.value.voice = ...;
  window.speechSynthesis.speak(utterance.value);
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

onMounted(() => {
  initializeSpeechRecognition();
});

onBeforeUnmount(() => {
  // Stop speech recognition and synthesis when the component is unmounted
  if (recognition.value) {
    recognition.value.stop();
  }
  if (utterance.value) {
    window.speechSynthesis.cancel();
  }
});
</script>

<style scoped>
.ai-interaction-area {
  width: 100%;
  /* height will be managed by flex-grow-1 */
}

.ai-interaction-area > div {
  width: fit-content; /* Adjust width based on content */
  max-width: 80%; /* Limit maximum width */
}

.input-controls-area {
  width: 100%;
  /* background-color: #f5f5f5; Add a background to the input area */
}
</style>
