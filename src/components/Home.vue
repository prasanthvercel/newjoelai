<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center app-background pa-0">

    <!-- Central Content Area (for current spoken line) -->
    <div
      class="central-content d-flex flex-column justify-center align-center elevation-5"
      :class="{ 'speaking-state': isSpeaking, 'listening-state': isListening }"
    >
      <!-- Display current spoken line -->
      <div v-if="currentUtterance" class="spoken-text">
        {{ currentUtterance }}
      </div>
      <div v-else class="placeholder-text">
        {{ isListening ? 'Listening...' : (isSpeaking ? 'Speaking...' : 'Tap the microphone to start') }}
      </div>

       <!-- Optional: Add a simple visualizer here (waveform/bars) -->
       <!-- You would need a library or custom implementation for this -->

    </div>

    <!-- Bottom Controls -->
    <div class="bottom-controls d-flex justify-center align-center pa-4">

      <!-- Microphone button (always visible) -->
      <v-btn
        icon
        large
        @click="startConversation"
        :disabled="isListening || isSpeaking"
        :class="{ 'active-icon': !isListening && !isSpeaking }"
        class="mx-4"
      >
        <v-icon size="48" color="black">mdi-microphone</v-icon>
      </v-btn>

      <!-- Stop button (always visible) -->
      <v-btn
        icon
        large
        @click="stopConversation"
        :disabled="!isListening && !isSpeaking"
        :class="{ 'active-icon': isListening || isSpeaking }"
        class="mx-4"
      >
        <v-icon size="48" color="black">mdi-stop-circle</v-icon>
      </v-btn>

      <!-- Optional: Call end icon if needed -->
      <!-- <v-btn icon large color="error" @click="endCall" class="mx-2">
          <v-icon size="48">mdi-phone-hangup</v-icon>
      </v-btn> -->

    </div>

  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// If you need specific icons not included globally, you might need to import them
// import '@mdi/font/css/materialdesignicons.css' // Ensure MDI font is available
// import { mdiMicrophone, mdiStopCircle, mdiPhoneHangup, mdiVolumeHigh } from '@mdi/js'; // If using @mdi/js

const isListening = ref(false);
const isSpeaking = ref(false);
const currentUtterance = ref(''); // To display the current spoken line

let recognition = null;
let synthesis = null;
let conversationHistory = []; // Array to store conversation context for API (kept for API context)

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
    currentUtterance.value = ''; // Clear previous utterance
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

    // Display interim transcript for immediate feedback (optional)
    if (interimTranscript) {
        currentUtterance.value = interimTranscript;
    }


    if (finalTranscript) {
      // Display final transcript
      currentUtterance.value = finalTranscript;
      // Send final transcript to API
      sendToApi(finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    isListening.value = false;
    console.error('Speech recognition error:', event.error);
    currentUtterance.value = `Error: ${event.error}`; // Display error
    // Handle errors, perhaps display a message or try restarting recognition
     // If an error occurs during continuous listening, you might want to restart
     // Only restart if not currently speaking to avoid conflicts
    if (!isSpeaking.value) {
       // recognition.start(); // Auto-restart for continuous - commented out as handled in speakText/sendToApi
    }
  };

  recognition.onend = () => {
    isListening.value = false;
    console.log('Speech recognition ended.');
    // Recognition might end unexpectedly, you might want to restart it
    // if the conversation is still active and not currently speaking
    if (!isSpeaking.value) { // Only restart if not currently speaking
        // recognition.start(); // Auto-restart for continuous - commented out as handled in speakText/sendToApi
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
  if (!synthesis || !text) {
    // If speaking fails or no text, try to restart listening
    if (recognition && !isListening.value) {
      recognition.start();
    }
    return;
  }

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
      currentUtterance.value = text; // Display the AI's response
      console.log('Speaking started.');
  };

  utterance.onend = () => {
      isSpeaking.value = false;
      console.log('Speaking ended.');
       // Speaking ends, go back to listening for continuous conversation
      if (recognition && !isListening.value) { // Check if recognition exists and is not already listening
        recognition.start(); // Auto-restart listening
      }
  };

  utterance.onerror = (event) => {
       isSpeaking.value = false;
       console.error('Text-to-speech error:', event.error);
       currentUtterance.value = `Speaking Error: ${event.error}`; // Display speaking error
       // Handle speaking errors
       // If speech synthesis fails, you might want to restart listening
      if (recognition && !isListening.value) { // Check if recognition exists and is not already listening
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
        currentUtterance.value = ''; // Clear previous utterance on start
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
  currentUtterance.value = ''; // Clear current utterance on stop
  conversationHistory = []; // Clear history on conversation end
  console.log('Conversation ended.');
};


// Send recognized speech to OpenAI API
async function sendToApi(text) {
    if (!text.trim()) {
        // If no text to send, restart listening
        if (recognition && !isListening.value) {
            recognition.start();
        }
        return;
    }

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
        if (recognition && !isListening.value) { // Check if recognition exists and is not already listening
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

/* Modified central area for displaying text */
.central-content {
  width: 80%; /* Adjust width as needed */
  max-width: 600px; /* Max width for larger screens */
  min-height: 150px; /* Minimum height */
  padding: 20px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.9); /* Slightly transparent white */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); /* Soft shadow */
  text-align: center;
  font-size: 1.2em;
  color: #333;
  transition: all 0.3s ease;
  position: relative; /* Needed for potential animations */
}

.spoken-text {
  font-weight: 500;
}

.placeholder-text {
  color: #777;
  font-style: italic;
}

/* Visual feedback for states on the central content area */
.listening-state {
  border: 2px solid #c471ed; /* Purple border when listening */
}

.speaking-state {
  border: 2px solid #66a6ff; /* Blue border when speaking */
  /* You can add pulse or waveform animations here */
}


/* Bottom Controls */
.bottom-controls {
  position: absolute;
  bottom: 40px; /* Adjust position as needed */
  width: 100%;
  display: flex; /* Ensure flexbox for button positioning */
  justify-content: center; /* Center the buttons */
  align-items: center;
}

/* Style for the icon buttons to ensure visibility */
.bottom-controls .v-btn {
    background-color: rgba(255, 255, 255, 0.9); /* Slightly transparent white background for visibility */
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3); /* Increased shadow for better contrast */
    transition: all 0.3s ease; /* Smooth transition for visual changes */
}

/* Style for disabled buttons */
.bottom-controls .v-btn:disabled {
    opacity: 0.5; /* Reduce opacity when disabled */
    cursor: not-allowed; /* Indicate not clickable */
}

/* Style for the active icon (highlighting) */
.active-icon {
  border: 3px solid #1867c0; /* Example: Add a blue border */
  box-shadow: 0 4px 12px rgba(0,0,0,0.4); /* Enhance shadow */
}
</style>
