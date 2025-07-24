<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center app-background pa-0">
    <!-- Center Display -->
    <div class="central-content d-flex flex-column justify-center align-center elevation-5"
         :class="{ 'speaking-state': isSpeaking, 'listening-state': isRecording }">
      <div v-if="currentUtterance" class="spoken-text">{{ currentUtterance }}</div>
      <div v-else class="placeholder-text">
        {{ isRecording ? 'Recording...' : (isSpeaking ? 'Speaking...' : 'Tap mic to start') }}
      </div>
    </div>

    <!-- Bottom Buttons -->
    <div class="bottom-controls d-flex justify-center align-center pa-4">
      <v-btn icon large @click="startRecording" :disabled="isRecording || isSpeaking" class="mx-4">
        <v-icon size="48">mdi-microphone</v-icon>
      </v-btn>
      <v-btn icon large @click="stopRecording" :disabled="!isRecording" class="mx-4">
        <v-icon size="48">mdi-stop-circle</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const isRecording = ref(false);
const isSpeaking = ref(false);
const currentUtterance = ref('');

let mediaRecorder;
let recordedChunks = [];

// Start audio recording
const startRecording = async () => {
  currentUtterance.value = '';
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  recordedChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
    await sendToWhisper(audioBlob);
  };

  mediaRecorder.start();
  isRecording.value = true;
};

// Stop audio recording
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
  }
};

// Send recorded audio to Whisper for transcription
const sendToWhisper = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'speech.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    const data = await response.json();
    currentUtterance.value = data.text;

    const aiResponse = await sendToChat(data.text);
    await speakWithTTS(aiResponse);

  } catch (err) {
    console.error('Whisper API error:', err);
    await speakWithTTS('Sorry, I could not understand that.');
  }
};

// Get reply from ChatGPT
const sendToChat = async (text) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful and friendly speaking assistant.' },
          { role: 'user', content: text }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Chat API error:', err);
    return 'Sorry, I had trouble responding.';
  }
};

// Use OpenAI Text-to-Speech API to speak reply
const speakWithTTS = async (text) => {
  try {
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1', // or 'tts-1-hd'
        voice: 'nova', // Options: alloy, echo, fable, nova, onyx, shimmer
        input: text
      })
    });

    const audioBlob = await ttsResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onplay = () => {
      isSpeaking.value = true;
      currentUtterance.value = text;
    };
    audio.onended = () => isSpeaking.value = false;
    audio.onerror = () => {
      console.error('TTS playback error');
      isSpeaking.value = false;
    };

    audio.play();
  } catch (err) {
    console.error('TTS API error:', err);
    isSpeaking.value = false;
  }
};
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
.bottom-controls {
  position: absolute;
  bottom: 40px;
  width: 100%;
  justify-content: center;
  align-items: center;
}
.v-btn {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}
</style>
