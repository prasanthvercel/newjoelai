<template>
  <v-container fluid class="fill-height d-flex flex-column pa-0">
    <!-- Top App Bar (already in App.vue) -->
    <!-- This section will be managed by App.vue -->

    <!-- Main Interaction Area (Chat Area) -->
    <div class="chat-area flex-grow-1 d-flex flex-column overflow-y-auto pa-4">
      <div v-for="(msg, i) in conv" :key="i" :class="msg.sender === 'user' ? 'align-self-end' : 'align-self-start'" class="my-1">
        <v-chip
          :color="msg.sender === 'user' ? 'primary' : 'grey lighten-2'"
          class="pa-4"
          label
          :text-color="msg.sender === 'user' ? 'white' : 'black'"
          style="height: auto; white-space: normal; word-break: break-word;"
          :class="{'rounded-br-xl rounded-tr-xl rounded-tl-xl': msg.sender === 'user', 'rounded-bl-xl rounded-tl-xl rounded-tr-xl': msg.sender === 'ai'}"
        >
          {{ msg.text }}
        </v-chip>
      </div>

      <div v-if="loading" class="d-flex justify-start mb-4">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </div>

    <!-- Bottom Control Area (for microphone/visualizer) -->
    <div class="bottom-control-area d-flex justify-center align-center pa-4">
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
            <!-- Simple placeholder -->
          </div>
        </div>
        <!-- End button -->
        <v-btn color="error" small @click="stopInteraction">End</v-btn>
      </div>
    </div>

    <!-- Bottom Navigation Bar (already in App.vue) -->
    <!-- This section will be managed by App.vue -->
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
    conv.value.push({ sender: 'ai', text: 'Error: Unable to get a response.' })\n  } finally {\n    loading.value = false\n    scrollBottom()\n  }\n}\n\n// Initialize browser speech recognition\nfunction initSpeechRecognition() {\n  if (!(\'webkitSpeechRecognition\' in window)) {\n    alert(\'Your browser does not support speech recognition.\')\n    return\n  }\n\n  recognition = new webkitSpeechRecognition()\n  recognition.lang = \'en-US\'\n  recognition.interimResults = false\n  recognition.continuous = false\n\n  recognition.onstart = () => (isListening.value = true)\n\n  recognition.onresult = (event) => {\n    const transcript = event.results[0][0].transcript\n    // Instead of putting in input, directly send the chat\n    sendChat(transcript)\n  }\n\n  recognition.onerror = (event) => {\n    console.error(\'Speech recognition error:\', event.error)\n    isListening.value = false\n  }\n\n  recognition.onend = () => {\n    isListening.value = false\n    // If not loading, and interaction wasn\'t stopped manually,\n    // you might want to go back to the idle mic state\n    if (!loading.value) {\n       // This might involve setting a state to show the initial mic button\n    }\n  }\n}\n\n// Initialize browser text-to-speech\nfunction initSpeechSynthesis() {\n  if (!(\'speechSynthesis\' in window)) {\n    alert(\'Your browser does not support text-to-speech.\')\n    return;\n  }\n  synthesis = window.speechSynthesis;\n}\n\n\nfunction toggleListening() {\n  if (!recognition) return\n  if (isListening.value) {\n    recognition.stop()\n  } else {\n    // Clear previous conversation when starting new voice interaction (optional)\n    // conv.value = [];\n    recognition.start()\n  }\n}\n\nfunction stopInteraction() {\n  if (isListening.value && recognition) {\n    recognition.stop(); // Stop listening\n  }\n  if (synthesis) {\n    synthesis.cancel(); // Stop speaking\n  }\n  loading.value = false; // Ensure loading is off\n  isListening.value = false; // Ensure listening is off\n  // Any other state resets\n}\n\n\n// Handle logout (if still needed)\n// async function handleLogout() {\n//   try {\n//     const { error } = await supabase.auth.signOut()\n//     if (error) throw error\n//     router.push('/login')\n//   } catch (error) {\n//     alert(error.message)\n//   }\n// }\n\n\nonMounted(() => {\n  initSpeechRecognition();\n  initSpeechSynthesis();\n});\n\nonBeforeUnmount(() => {\n  recognition?.stop()\n  synthesis?.cancel()\n})\n</script>\n\n<style scoped>\n.chat-area {\n  background-color: #f9f9f9;\n  flex-grow: 1; /* Make the chat area take up available space */\n}\n\n.chat-area > div {\n  width: fit-content; /* Adjust width based on content */\n  max-width: 80%; /* Limit maximum width */\n}\n\n.bottom-control-area {\n  width: 100%;\n  background-color: white; /* Add a background */\n  box-shadow: 0 -2px 4px rgba(0,0,0,0.1); /* Add a subtle shadow */\n}\n\n.voice-visualizer {\n  /* Add animation or dynamic styling later */\n  /* For now, it's just a blue circle */\n}\n</style>\n", "status": "succeeded"}}
I understand. Let's refine the styling and layout in `Home.vue` to make it look better and more closely resemble the Gemini Live interface based on your screenshot.

Here's what I'll do to improve the appearance:

1.  **Refine Chat Bubble Styling:** Make the chat bubbles look more like conversational messages with rounded corners and appropriate spacing.
2.  **Adjust Layout for Top/Bottom Nav:** Ensure the chat area properly fills the space between the top app bar (which is in `App.vue`) and the bottom control area/bottom navigation bar (also in `App.vue`).
3.  **Center Bottom Controls:** Make sure the microphone button and related elements in the bottom control area are horizontally centered.

Here's the updated `Home.vue` code with improved styling:
