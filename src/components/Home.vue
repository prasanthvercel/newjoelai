<template>
  <v-container fluid class="fill-height d-flex flex-column pa-0">
    <v-toolbar flat>
      <v-toolbar-title>English Voice Tutor</v-toolbar-title>
    </v-toolbar>

    <div class="ai-interaction-area flex-grow-1 d-flex flex-column overflow-y-auto p-4" ref="chatArea">
      <div v-for="(msg, i) in conv" :key="i" :class="msg.sender==='user'?'align-self-end':'align-self-start'">
        <v-chip :color="msg.sender==='user'?'primary':'grey lighten-2'" class="ma-2 pa-4" :rounded="true">
          {{ msg.text }}
        </v-chip>
      </div>
      <div v-if="loading" class="d-flex justify-center my-2">
        <v-progress-circular indeterminate color="primary"/>
      </div>
    </div>

    <v-row class="pa-4">
      <v-btn icon @click="toggleListening" :color="isListening?'red':'primary'">
        <v-icon>{{ isListening ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
      </v-btn>

      <v-text-field
        v-model="input"
        placeholder="Speak or type..."
        dense outlined hide-details class="flex-grow-1 mx-2"
        @keyup.enter="sendChat"
        :disabled="loading || isListening"
      />

      <v-btn @click="sendChat" :disabled="!input || loading">Send</v-btn>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { Configuration, OpenAIApi } from 'openai';

// OpenAI setup
const openai = new OpenAIApi(new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
}));

const input = ref('');
const conv = ref([]);
const loading = ref(false);
const isListening = ref(false);
const chatArea = ref(null);

let recognition;

function scrollBottom() {
  nextTick(() => {
    if (chatArea.value) chatArea.value.scrollTop = chatArea.value.scrollHeight;
  });
}

// Speech-to-text
function initSpeech() {
  if (!('webkitSpeechRecognition' in window)) return;
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => isListening.value = true;
  recognition.onresult = e => {
    input.value = e.results[0][0].transcript;
    sendChat();
  };
  recognition.onend = () => isListening.value = false;
}

function toggleListening() {
  if (isListening.value) recognition.stop();
  else recognition.start();
}

// Text-to-speech
function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  speechSynthesis.speak(u);
}

// Send chat
async function sendChat() {
  if (!input.value.trim() || loading.value) return;
  const userMsg = input.value;
  conv.value.push({ sender: 'user', text: userMsg });
  input.value = '';
  loading.value = true;
  scrollBottom();

  try {
    const resp = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = resp.data.choices[0].message.content;
    conv.value.push({ sender: 'ai', text });
    speak(text);
  } catch (err) {
    console.error(err);
    conv.value.push({ sender: 'ai', text: 'Oops, something went wrong.' });
  } finally {
    loading.value = false;
    scrollBottom();
  }
}

onMounted(() => initSpeech());
onBeforeUnmount(() => {
  if (recognition) recognition.abort();
  speechSynthesis.cancel();
});
</script>

<style scoped>
.ai-interaction-area {
  overflow-y: auto;
}
</style>
