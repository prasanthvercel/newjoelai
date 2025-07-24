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

    <!-- Mic and Stop controls -->
    <div class="bottom-controls d-flex justify-center align-center pa-4">
      <!-- Microphone button -->
      <v-btn icon large @click="startConversation" class="mx-4" :disabled="isListening || isSpeaking">
        <v-icon size="48" color="black">mdi-microphone</v-icon>
      </v-btn>

      <!-- Stop button -->
      <v-btn icon large @click="stopConversation" class="mx-4" :disabled="!isListening && !isSpeaking">
        <v-icon size="48" color="black">mdi-stop-circle</v-icon>
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
  { role: 'system', content: 'You are a helpful spoken english assistant who speaks clearly and very brief and short.' }
];

function initSpeechRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = true;
  recognition.continuous = true; // Set to true for continuous listening

  recognition.onstart = () => {
    isListening.value = true;
    currentUtterance.value = '';
    // Cancel synthesis if it's speaking when recognition starts
    if (synthesis.speaking) {
        synthesis.cancel();
        isSpeaking.value = false;
    }
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      finalTranscript += event.results[i][0].transcript;
    }
    // Display interim transcript for immediate feedback (optional)
     let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (!event.results[i].isFinal) {
              interimTranscript += event.results[i][0].transcript;
          }
      }
      if (interimTranscript) {
          currentUtterance.value = interimTranscript;
      }


    if (finalTranscript) {
      currentUtterance.value = finalTranscript;
      // Send final transcript to AI and stop listening temporarily
      recognition.stop(); // Stop recognition while processing/speaking
      sendToAI(finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Recognition error', event.error);
    isListening.value = false;
     // Optionally display an error message to the user
    currentUtterance.value = `Error: ${event.error}`;
    // Attempt to restart recognition after an error
    if (!isSpeaking.value) { // Only restart if not currently speaking
        recognition.start();
    }
  };

  recognition.onend = () => {
    isListening.value = false;
    console.log('Recognition ended.');
    // If recognition ends unexpectedly during a conversation, restart it
    if (!isSpeaking.value && history.length > 1) { // Check if not speaking and conversation has started
         console.log('Recognition ended unexpectedly, restarting.');
        recognition.start();
    }
  };
}

function startConversation() {
    if (!recognition) initSpeechRecognition();
    // Start recognition only if not already listening or speaking
    if (!isListening.value && !isSpeaking.value) {
        // Reset history only at the beginning of a new conversation session
        if (history.length <= 1) { // Check if only the system message is in history
             history = [
                { role: 'system', content: 'You are a helpful assistant who speaks clearly and concisely.' }
            ];
        }
        recognition.start();
    }
}

function stopConversation() {
    if (isListening.value && recognition) {
        recognition.stop();
    }
    if (synthesis.speaking) {
        synthesis.cancel();
    }
    isListening.value = false;
    isSpeaking.value = false;
    currentUtterance.value = '';
    history = []; // Clear history on conversation end
}

async function sendToAI(text) {
  isListening.value = false; // Stop listening while processing and speaking
  isSpeaking.value = false; // Set speaking to false initially
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
    // If API fails, restart listening to allow the user to try again
    recognition.start();
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
    currentUtterance.value = ''; // Clear utterance after speaking
    // Restart listening after AI finishes speaking
    recognition.start();
  };

   utterance.onerror = (event) => {
        isSpeaking.value = false;
        console.error('Speech synthesis error:', event);
        currentUtterance.value = `Speaking Error: ${event.error}`;
         // If speaking fails, restart listening
        recognition.start();
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
  position: relative;
  display: flex; /* Ensure flex properties */
  flex-direction: column;
  justify-content: center;
  align-items: center;
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
.bottom-controls {
  position: absolute;
  bottom: 40px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.bottom-controls .v-btn {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}
</style>
