<template>
  <div class="relative h-screen bg-white flex flex-col items-center justify-center">
    <!-- Background Wave (simplified) -->
    <div class="absolute top-0 left-0 w-full h-1/2 bg-pink-300" style="clip-path: ellipse(100% 55% at 48% 45%);"></div>

    <div class="relative z-10 text-center p-6">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome</h1>
      <p class="text-gray-600 mb-8">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      <router-link to="/login" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-pink-500 hover:bg-pink-600 md:py-4 md:text-lg md:px-8">
        Continue <span class="ml-2">&rarr;</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
// No script logic needed for this simple Welcome page
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>
