<template>
  <v-container fluid class="fill-height d-flex flex-column pa-0">
    <v-app-bar color="primary" dark flat>
      <v-toolbar-title>🎧 English Voice Tutor</v-toolbar-title>
    </v-app-bar>

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

    <v-row class="pa-4" align="center">
      <v-btn icon :color="isListening ? 'red' : 'primary'" @click="toggleListening">
        <v-icon>{{ isListening ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
      </v-btn>

      <v-text-field
        v-model="input"
        placeholder="Speak or type your question..."
        dense
        outlined
        hide-details
        class="flex-grow-1 mx-2"
        @keyup.enter="sendChat"
        :disabled="loading || isListening"
      />

      <v-btn color="primary" @click="sendChat" :disabled="!input || loading">Send</v-btn>
    </v-row>
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

// Auto-scroll to bottom
function scrollBottom() {
  nextTick(() => {
    if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight
  })
}

// Speak text using browser TTS
function speak(text) {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  speechSynthesis.speak(u)
}

// Send chat to OpenAI API
async function sendChat() {
  if (!input.value.trim() || loading.value) return

  const userMsg = input.value
  conv.value.push({ sender: 'user', text: userMsg })
  input.value = ''
  loading.value = true
  scrollBottom()

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
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
    speak(reply)
  } catch (err) {
    console.error('OpenAI error:', err)
    conv.value.push({ sender: 'ai', text: 'Error: Unable to reach OpenAI.' })
  } finally {
    loading.value = false
    scrollBottom()
  }
}

// Initialize browser speech recognition
function initSpeech() {
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
    input.value = transcript
    sendChat()
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    isListening.value = false
  }

  recognition.onend = () => (isListening.value = false)
}

function toggleListening() {
  if (!recognition) return
  if (isListening.value) {
    recognition.stop()
  } else {
    recognition.start()
  }
}

onMounted(() => initSpeech())
onBeforeUnmount(() => {
  recognition?.stop()
  speechSynthesis.cancel()
})
</script>

<style scoped>
.chat-area {
  background-color: #f9f9f9;
}
</style>
