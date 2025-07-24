<template>
  <v-container fluid class="fill-height d-flex flex-column pa-0">
    <!-- Top Navigation Bar -->
    <v-app-bar color="pink-darken-1" dark flat>
      <v-container class="d-flex align-center">
        <v-avatar size="40" rounded="circle">
          <v-img src="/logo.png" alt="Logo"></v-img>
        </v-avatar>
        <v-toolbar-title class="ml-3">English Voice Tutor</v-toolbar-title>
        <v-spacer></v-spacer>
        <!-- Top right actions (if any) -->
      </v-container>
    </v-app-bar>

    <!-- Main Interaction Area -->
    <div class="chat-area flex-grow-1 d-flex flex-column overflow-y-auto pa-4" ref="chatArea">
      <div v-for="(msg, i) in conv" :key="i" :class="msg.sender === 'user' ? 'align-self-end' : 'align-self-start'">
        <v-chip
          :color="msg.sender === 'user' ? 'primary' : 'grey lighten-2'"
          class="ma-2 pa-4"
          label
          :text-color="msg.sender === 'user' ? 'white' : 'black'"
        >
          {{ msg.text }}
        </v-chip>
      </div>

      <div v-if="loading" class="d-flex justify-start mb-4">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </div>

    <!-- Bottom Control Area -->
    <v-footer app class="pa-4">
      <v-container class="d-flex justify-center align-center">
        <div v-if="!isListening && !loading">
          <!-- Microphone button when not listening or loading -->
          <v-btn icon :color="isListening ? 'red' : 'primary'" size="x-large" @click="toggleListening">
            <v-icon size="36">{{ isListening ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
          </v-btn>
        </div>

        <div v-if="isListening || loading" class="d-flex flex-column align-center">
          <!-- Visualizer or status when listening/loading -->
          <div class="mb-2">
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="primary"
              size="50"
              width="5"
            ></v-progress-circular>
            <!-- Placeholder for a voice visualizer when listening -->
            <div v-else class="voice-visualizer" style="width: 50px; height: 50px; background-color: blue; border-radius: 50%;">
              <!-- Simple placeholder for a visualizer effect -->
            </div>
          </div>
          <!-- End button -->
          <v-btn color="error" small @click="stopInteraction">End</v-btn>
        </div>
      </v-container>
    </v-footer>

    <!-- Bottom Navigation Bar (if needed) -->
    <!-- <v-bottom-navigation grow>
      <v-btn value="recent">
        <v-icon>mdi-history</v-icon>
        Recent
      </v-btn>
      <v-btn value="favorites">
        <v-icon>mdi-heart</v-icon>
        Favorites
      </v-btn>
      <v-btn value="nearby">
        <v-icon>mdi-map-marker</v-icon>
        Nearby
      </v-btn>
    </v-bottom-navigation> -->

    <!-- Logout Button (can be placed elsewhere) -->
    <!-- <v-btn color="error" @click="handleLogout" class="mt-6">Logout</v-btn> -->
  </v-container>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

const input = ref('')
const conv = ref([])
const loading = ref(false)
const isListening = ref(false)
const chatArea = ref(null)
let recognition = null
let synthesis = null

// Auto-scroll to bottom
function scrollBottom() {
  nextTick(() => {
    if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight
  })
}

// Speak text using browser TTS
function speak(text) {
  if (!synthesis) return;
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  synthesis.speak(u)
}

// Send chat to OpenAI API (or your Gemini API endpoint)
async function sendChat(message) {
  if (!message.trim() || loading.value) return

  const userMsg = message
  conv.value.push({ sender: 'user', text: userMsg })
  input.value = '' // Clear text input after sending
  loading.value = true
  scrollBottom()

  try {
    // ** Replace with your Gemini API call logic **
    // Using OpenAI API for now as per your provided code
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, // Using OpenAI API key
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a friendly English tutor. Help the user learn and speak English clearly.' },
          { role: 'user', content: userMsg },
        ],
      }),
    })

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'I didn’t understand that.'

    conv.value.push({ sender: 'ai', text: reply })
    speak(reply) // Speak the AI response
  } catch (err) {
    console.error('API error:', err)
    conv.value.push({ sender: 'ai', text: 'Error: Unable to get a response.' })
  } finally {
    loading.value = false
    scrollBottom()
  }
}

// Initialize browser speech recognition
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Your browser does not support speech recognition.')
    return
  }

  recognition = new webkitSpeechRecognition()
  recognition.lang = 'en-US'
  recognition.interimResults = false
  recognition.continuous = false

  recognition.onstart = () => (isListening.value = true)

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    // Instead of putting in input, directly send the chat
    sendChat(transcript)
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    isListening.value = false
  }

  recognition.onend = () => {
    isListening.value = false
    // If not loading, and interaction wasn't stopped manually,
    // you might want to go back to the idle mic state
    if (!loading.value) {
       // This might involve setting a state to show the initial mic button
    }
  }
}

// Initialize browser text-to-speech
function initSpeechSynthesis() {
  if (!('speechSynthesis' in window)) {
    alert('Your browser does not support text-to-speech.')
    return;
  }
  synthesis = window.speechSynthesis;
}


function toggleListening() {
  if (!recognition) return
  if (isListening.value) {
    recognition.stop()
  } else {
    // Clear previous conversation when starting new voice interaction (optional)
    // conv.value = [];
    recognition.start()
  }
}

function stopInteraction() {
  if (isListening.value && recognition) {
    recognition.stop(); // Stop listening
  }
  if (synthesis) {
    synthesis.cancel(); // Stop speaking
  }
  loading.value = false; // Ensure loading is off
  isListening.value = false; // Ensure listening is off
  // Any other state resets
}


// Handle logout (if still needed)
// async function handleLogout() {
//   try {
//     const { error } = await supabase.auth.signOut()
//     if (error) throw error
//     router.push('/login')
//   } catch (error) {
//     alert(error.message)
//   }
// }


onMounted(() => {
  initSpeechRecognition();
  initSpeechSynthesis();
});

onBeforeUnmount(() => {
  recognition?.stop()
  synthesis?.cancel()
})
</script>

<style scoped>
.chat-area {
  background-color: #f9f9f9;
}

.chat-area > div {
  width: fit-content; /* Adjust width based on content */
  max-width: 80%; /* Limit maximum width */
}

.v-footer {
  width: 100%;
  background-color: white; /* Match app bar background */
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1); /* Add a subtle shadow */
}

.voice-visualizer {
  /* Add animation or dynamic styling later */
  /* For now, it's just a blue circle */
}
</style>
