<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center app-background pa-0">

    <!-- Central Gradient Circle -->
    <div
      class="gradient-circle d-flex justify-center align-center elevation-10"
      :class="{ 'speaking-gradient': isSpeaking, 'listening-gradient': isListening, 'idle-gradient': !isSpeaking && !isListening, 'animate-gradient': isSpeaking }"
    >
      <!-- Icon inside the circle -->
      <v-icon size="80" color="white">{{ isSpeaking ? 'mdi-volume-high' : 'mdi-microphone' }}</v-icon>
    </div>

    <!-- Bottom Controls -->
    <div class="bottom-controls d-flex justify-center align-center pa-4">
      <div v-if="!isListening && !isSpeaking">
        <!-- Microphone icon to start new conversation -->
        <v-btn icon large @click="startConversation">
          <v-icon size="48" color="black">mdi-microphone</v-icon>
        </v-btn>
      </div>

      <div v-else class="d-flex align-center">
        <!-- Stop conversation icon -->
        <v-btn icon large @click="stopConversation" class="mx-4">
            <v-icon size="48" color="black">mdi-stop-circle</v-icon>
        </v-btn>
         <!-- Call end icon (optional, if you want both stop and call end) -->
         <!-- <v-btn icon large color="error" @click="endCall" class="mx-2">
            <v-icon size="48">mdi-phone-hangup</v-icon>
        </v-btn> -->
      </div>
    </div>

  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isListening = ref(false);
const isSpeaking = ref(false);

let recognition = null;
let synthesis = null;
let conversationHistory = []; // Array to store conversation context for API

// Accessing OpenAI API Key from environment variables
// ** WARNING: NOT SECURE FOR PRODUCTION WITH API KEYS IN FRONTEND **
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';


// Initialize browser speech recognition
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    console.error('Web Speech API is not supported by this browser.');
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true; // Continuous listening
  recognition.interimResults = true; // Get interim results
  recognition.lang = 'en-IN'; // Attempt to set to Indian English

  recognition.onstart = () => {
    isListening.value = true;
    isSpeaking.value = false; // Not speaking when listening starts
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

    // You can use interimTranscript for real-time visualization feedback if needed
    // console.log('Interim:', interimTranscript);
    console.log('Final:', finalTranscript);

    if (finalTranscript) {
      // Send final transcript to API
      sendToApi(finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    isListening.value = false;
    console.error('Speech recognition error:', event.error);
    // Handle errors, perhaps display a message or try restarting recognition
     // If an error occurs during continuous listening, you might want to restart
    if (!isSpeaking.value) {
       // recognition.start(); // Auto-restart for continuous
    }
  };

  recognition.onend = () => {
    isListening.value = false;
    console.log('Speech recognition ended.');
    // Recognition might end unexpectedly, you might want to restart it
    // if the conversation is still active
    if (!isSpeaking.value) { // Only restart if not currently speaking
        // recognition.start(); // Auto-restart for continuous
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
      // You can set the default voice here or when creating the utterance
      // synthesis.defaultVoice = indianVoice;
       console.log('Indian English voice available:', indianVoice.name);
    } else {
      console.warn('Indian English voice not found. Using default.');
    }
  };
}

const speakText = (text) => {
  if (!synthesis || !text) return;

  const utterance = new SpeechSynthesisUtterance(text);
   // Attempt to set Indian English voice here as well
  const voices = synthesis.getVoices();
  const indianVoice = voices.find(voice => voice.lang === 'en-IN' || voice.name.includes('India'));
  if (indianVoice) {
    utterance.voice = indianVoice;
  }

  utterance.onstart = () => {
      isSpeaking.value = true;
      isListening.value = false; // Not listening when speaking starts
      console.log('Speaking started.');
  };

  utterance.onend = () => {
      isSpeaking.value = false;
      console.log('Speaking ended.');
       // Speaking ends, go back to listening for continuous conversation
      if (!isListening.value) { // Prevent double-starting if already listening
        recognition.start(); // Auto-restart listening
      }
  };

  utterance.onerror = (event) => {
       isSpeaking.value = false;
       console.error('Text-to-speech error:', event.error);
       // Handle speaking errors
       // If speech synthesis fails, you might want to restart listening
      if (!isListening.value) {
         recognition.start(); // Auto-restart listening
      }
  };


  synthesis.speak(utterance);
};

const startConversation = () => {
    if (!recognition) {
        initSpeechRecognition(); // Initialize if not already
    }
     if (!synthesis) {
        initSpeechSynthesis(); // Initialize if not already
    }
    if (recognition && !isListening.value) {
        conversationHistory = [{ role: 'system', content: 'You are a friendly English tutor. Help the user learn and speak English clearly and concisely. Avoid using asterisks or formatting characters.' }]; // Initialize history with system message
        recognition.start();
    }
};

const stopConversation = () => {
  if (isListening.value && recognition) {
    recognition.stop(); // Stop listening
  }
  if (synthesis && synthesis.speaking) {
    synthesis.cancel(); // Stop speaking
  }
  isListening.value = false;
  isSpeaking.value = false;
  conversationHistory = []; // Clear history on conversation end
  console.log('Conversation ended.');
};


// Send recognized speech to OpenAI API
async function sendToApi(text) {
    if (!text.trim()) return;

    isListening.value = false; // Stop listening while processing and speaking
     // isSpeaking.value = true; // Indicate processing/speaking state - manage in speakText

    // Add user message to history for context
    conversationHistory.push({ role: 'user', content: text });

    try {
        // ** OpenAI API call logic **
         const response = await fetch(OPENAI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`, // Use Authorization: Bearer for OpenAI
            },
            body: JSON.stringify({
                 model: 'gpt-3.5-turbo', // Or your preferred OpenAI model
                 messages: conversationHistory, // Send the conversation history
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();
         // Adjust response parsing for OpenAI chat completions
        const aiResponse = responseData.choices?.[0]?.message?.content?.trim() || 'Error: Could not get AI response.';

         // Add AI response to history
        conversationHistory.push({ role: 'assistant', content: aiResponse }); // Use 'assistant' role for AI in OpenAI history

        speakText(aiResponse); // Speak the AI response

    } catch (error) {
        console.error('Error sending to API:', error);
         // Handle API errors, perhaps speak an error message
         speakText('Sorry, I encountered an error.');
        isSpeaking.value = false; // Ensure speaking state is off on error
         // If API call fails, you might want to go back to listening
        if (!isListening.value) {
            recognition.start(); // Auto-restart listening
        }
    }
}


onMounted(() => {
  // Initialize on mount, but don't start listening until user taps mic
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
.app-background {
  background: linear-gradient(180deg, #f0f2f5 0%, #e0e5ec 100%); /* Subtle light background */
}

.gradient-circle {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  /* More refined gradient placeholders */
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); /* Idle: light blues and pinks */
  transition: background 0.8s ease-in-out; /* Smoother transition */
  position: relative; /* Needed for potential pseudo-elements for animation */
  overflow: hidden; /* Hide overflowing animation elements */
}

.listening-gradient {
  background: linear-gradient(135deg, #c471ed 0%, #fcc5e4 100%); /* Listening: purples and pinks */
}

.speaking-gradient {
  background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%); /* Speaking: blues */
   /* Animation placeholder for speaking */
   animation: speaking-pulse 1.5s infinite ease-in-out;
}

@keyframes speaking-pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.9;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}


.bottom-controls {
  position: absolute;
  bottom: 40px; /* Adjust position as needed */
  width: 100%;
}

/* Style for the icon buttons to ensure visibility */
.bottom-controls .v-btn {
    background-color: rgba(255, 255, 255, 0.8); /* Slightly transparent white background for visibility */
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
</style>
