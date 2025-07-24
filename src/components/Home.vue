<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center pa-0">
    <!-- Top App Bar (managed by App.vue) -->

    <!-- Main Interaction Area -->
    <div class="main-interaction-area flex-grow-1 d-flex flex-column justify-center align-center pa-4">
      <!-- Display Current Sentence -->
      <div v-if="currentSentence" class="current-sentence text-h6 text-center mb-4">
        {{ currentSentence }}
      </div>

      <!-- Visualizer Area -->
      <div class="visualizer-area d-flex justify-center align-center" style="height: 200px;">
        <!-- Placeholder for Listening/Speaking Visualizer -->
        <div v-if="isListening" class="listening-visualizer">
          <!-- Simple placeholder for listening waves -->
          <v-icon size="60" color="primary">mdi-microphone</v-icon>
          <p class="text-caption mt-2">Listening...</p>
        </div>
        <div v-else-if="loading || isSpeaking" class="speaking-visualizer">
          <!-- Simple placeholder for speaking/processing waves -->
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="primary"
            size="80"
            width="8"
          ></v-progress-circular>
          <v-icon v-else size="60" color="primary">mdi-volume-high</v-icon>
           <p class="text-caption mt-2">{{ loading ? 'Processing...' : 'Speaking...' }}</p>
        </div>
        <div v-else class="idle-mic">
           <v-icon size="60" color="grey">mdi-microphone</v-icon>
           <p class="text-caption mt-2">Tap to speak</p>
        </div>
      </div>
    </div>

    <!-- Bottom Control Area -->
    <div class="bottom-control-area d-flex justify-center align-center pa-4">
      <div v-if="!isListening && !loading && !isSpeaking">
        <!-- Microphone button to start -->
        <v-btn icon color="primary" size="x-large" @click="toggleListening">
          <v-icon size="36">mdi-microphone</v-icon>
        </v-btn>
      </div>

      <div v-if="isListening || loading || isSpeaking">
        <!-- End button to stop -->
        <v-btn color="error" large rounded @click="stopInteraction">End Conversation</v-btn>
      </div>
    </div>

    <!-- Bottom Navigation Bar (managed by App.vue) -->
  </v-container>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';

const currentSentence = ref('');
const loading = ref(false);
const isListening = ref(false);
const isSpeaking = ref(false);

let recognition = null;
let synthesis = null;

// ** Replace with your actual Gemini API Key (NOT SECURE FOR PRODUCTION)**
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// ** Hardcoded Gemini API Endpoint for text-based chat**
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Initialize browser speech recognition
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    console.error('Web Speech API is not supported by this browser.');
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true; // Get interim results to display text while speaking
  recognition.lang = 'en-IN'; // Attempt to set to Indian English

  recognition.onstart = () => {
    isListening.value = true;
    currentSentence.value = ''; // Clear previous sentence
    console.log('Speech recognition started.');
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    currentSentence.value = finalTranscript || interimTranscript; // Display final or interim transcript
    console.log('Transcript:', currentSentence.value);

    if (finalTranscript) {
      // Send final transcript to API
      sendToApi(finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    isListening.value = false;
    console.error('Speech recognition error:', event.error);
    currentSentence.value = 'Error listening. Tap to try again.';
  };

  recognition.onend = () => {
    isListening.value = false;
    console.log('Speech recognition ended.');
    if (!loading.value && !currentSentence.value) {
        currentSentence.value = 'No speech detected. Tap to speak.';
    }
  };
}

// Initialize browser text-to-speech
function initSpeechSynthesis() {
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech is not supported by this browser.');
    return;
  }
  synthesis = window.speechSynthesis;

  // Find an Indian English voice (if available)
  synthesis.onvoiceschanged = () => {
    const voices = synthesis.getVoices();
    const indianVoice = voices.find(voice => voice.lang === 'en-IN' || voice.name.includes('India'));
    if (indianVoice) {
      utterance.value.voice = indianVoice;
      console.log('Using Indian English voice:', indianVoice.name);
    } else {
      console.warn('Indian English voice not found. Using default.');
    }
  };
}

const speakText = (text) => {
  if (!synthesis || !text) return;

  utterance.value = new SpeechSynthesisUtterance(text);
   // Attempt to set Indian English voice here as well
  const voices = synthesis.getVoices();
  const indianVoice = voices.find(voice => voice.lang === 'en-IN' || voice.name.includes('India'));
  if (indianVoice) {
    utterance.value.voice = indianVoice;
  }

  utterance.value.onstart = () => {
      isSpeaking.value = true;
      loading.value = false; // Speaking starts, so not just loading
  };

  utterance.value.onend = () => {
      isSpeaking.value = false;
      currentSentence.value = ''; // Clear sentence after speaking
       // You might want to go back to listening automatically here
      // toggleListening();
  };

  utterance.value.onerror = (event) => {
       isSpeaking.value = false;
       console.error('Text-to-speech error:', event.error);
       currentSentence.value = 'Error speaking.';
  };


  synthesis.speak(utterance.value);
};

const toggleListening = () => {
  if (!recognition) return;
  if (isListening.value) {
    recognition.stop();
  } else {
     currentSentence.value = ''; // Clear previous on start
    recognition.start();
  }
};

const stopInteraction = () => {
  if (isListening.value && recognition) {
    recognition.stop(); // Stop listening
  }
  if (synthesis && synthesis.speaking) {
    synthesis.cancel(); // Stop speaking
  }
  loading.value = false;
  isListening.value = false;
  isSpeaking.value = false;
  currentSentence.value = ''; // Clear current sentence on end
};

// Send recognized speech to Gemini API
async function sendToApi(text) {
    if (!text.trim() || loading.value) return;

    loading.value = true;
    isListening.value = false; // Stop listening while processing

    try {
        // ** Your Gemini API call logic here **
         const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY, // Use x-goog-api-key
            },
            body: JSON.stringify({
                 // Adjust based on Gemini API documentation for prompt format
                contents: [{
                    role: 'user',
                    parts: [{ text: text }]
                }],
                 // Add instructions to avoid asterisks
                 system_instructions: "Do not include any asterisks or formatting characters in your response.",
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();
         // Adjust response parsing
        const aiResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: Could not get AI response.';

        currentSentence.value = aiResponse; // Display AI response
        speakText(aiResponse); // Speak the AI response

    } catch (error) {
        console.error('Error sending to API:', error);
        currentSentence.value = 'Error processing your request.';
        loading.value = false;
    }
}


onMounted(() => {
  initSpeechRecognition();
  initSpeechSynthesis();
});

onBeforeUnmount(() => {
  recognition?.stop();
  if (synthesis && synthesis.speaking) {
     synthesis.cancel();
  }
});
</script>

<style scoped>
.main-interaction-area {
  width: 100%;
}

.visualizer-area {
  width: 100%;
}

.bottom-control-area {
  width: 100%;
  background-color: white;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
}

.listening-visualizer,
.speaking-visualizer,
.idle-mic {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

/* You'll need more complex CSS or a library for actual wave animations */
.listening-visualizer v-icon,
.speaking-visualizer v-icon {
    /* Basic animation placeholder */
    animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
    0% {
        transform: scale(0.9);
        opacity: 0.7;
    }
    50% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(0.9);
        opacity: 0.7;
    }
}
</style>
