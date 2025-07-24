<template>
  <v-container fluid class="fill-height d-flex flex-column justify-center align-center">
    <!-- Background Wave (simplified - Vuetify equivalent or custom if needed) -->
    <!-- For a simple background color, you can apply it to the container or a parent element -->
    <!-- For complex shapes like your current wave, you might need custom CSS or an SVG -->

    <v-card class="text-center pa-6" elevation="0">
      <v-card-title class="text-h4 font-weight-bold mb-4">Welcome</v-card-title>
      <v-card-text class="text-subtitle-1 mb-8">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</v-card-text>
      <router-link to="/login" class="text-decoration-none">
        <v-btn color="pink-darken-1" size="large" rounded="xl">
          Continue
          <v-icon right>mdi-arrow-right</v-icon>
        </v-btn>
      </router-link>
    </v-card>
  </v-container>
</template>

<script setup>
// No script logic needed for this simple Welcome page
</script>

<style scoped>
/* Vuetify handles most styling, custom styles can be added here if necessary */
</style>