<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center app-background pa-0">
    <!-- Display current user/AI line -->
    <div class="central-content d-flex flex-column justify-center align-center elevation-5"
         :class="{ 'speaking-state': isSpeaking, 'listening-state': isListening }">
      <div v-if="currentUtterance" class="spoken-text">
        {{ currentUtterance }}
      </div>
      <div v-else class="placeholder-text">
        {{ isListening ? 'Listening...' : (isSpeaking ? 'Speaking...' : 'Tap the mic to start') }}
      </div>
    </div>

    <!-- Mic/Stop controls -->
    <div class="bottom-controls d-flex justify-center align-center pa-4">
      <v-btn icon large @click="toggleListening" class="mx-4" :disabled="isSpeaking">
        <v-icon size="48" color="black">
          {{ isListening ? 'mdi-stop-circle' : 'mdi-microphone' }}
        </v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isListening = ref(false);
const isSpeaking = ref(false);
const currentUtterance = ref('');

let recognition = null;
let synthesis = window.speechSynthesis;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

let history = [
  { role: 'system', content: 'You are a helpful assistant who speaks clearly and concisely.' }
];

function initSpeechRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = true;
  recognition.continuous = false; // Listen per utterance

  recognition.onstart = () => {
    isListening.value = true;
    currentUtterance.value = '';
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      finalTranscript += event.results[i][0].transcript;
    }
    currentUtterance.value = finalTranscript;
    sendToAI(finalTranscript);
  };

  recognition.onerror = (event) => {
    console.error('Recognition error', event.error);
    isListening.value = false;
  };

  recognition.onend = () => {
    isListening.value = false;
  };
}

function toggleListening() {
  if (isListening.value) {
    recognition.stop();
  } else {
    startListening();
  }
}

function startListening() {
  if (!recognition) initSpeechRecognition();
  recognition.start();
}

async function sendToAI(text) {
  isListening.value = false;
  isSpeaking.value = false;
  history.push({ role: 'user', content: text });

  try {
    const res = await fetch(GROQ_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: history,
      })
    });

    const data = await res.json();
    const reply = data.choices[0].message.content.trim();
    history.push({ role: 'assistant', content: reply });
    speakReply(reply);
  } catch (err) {
    console.error('GROQ API error:', err);
    speakReply('Sorry, I encountered an error.');
  }
}

function speakReply(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = synthesis.getVoices();
  const indianVoice = voices.find(v => v.lang === 'en-IN');
  if (indianVoice) utterance.voice = indianVoice;

  utterance.onstart = () => {
    isSpeaking.value = true;
    currentUtterance.value = text;
  };

  utterance.onend = () => {
    isSpeaking.value = false;
    currentUtterance.value = '';
    startListening();
  };

  synthesis.speak(utterance);
}

onMounted(() => {
  initSpeechRecognition();
});

onBeforeUnmount(() => {
  recognition?.stop();
  if (synthesis.speaking) synthesis.cancel();
});
</script>

<style scoped>
.app-background {
  background: linear-gradient(180deg, #f0f2f5 0%, #e0e5ec 100%);
}
.central-content {
  width: 80%;
  max-width: 600px;
  min-height: 150px;
  padding: 20px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  text-align: center;
  font-size: 1.2em;
  color: #333;
  transition: all 0.3s ease;
}
.spoken-text {
  font-weight: 500;
}
.placeholder-text {
  color: #777;
  font-style: italic;
}
.listening-state {
  border: 2px solid #c471ed;
}
.speaking-state {
  border: 2px solid #66a6ff;
}
.bottom-controls .v-btn {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}
</style>
