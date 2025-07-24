<template>
  <v-app>
    <v-app-bar app color="pink-darken-1" elevation="1">
      <v-container class="d-flex align-center">
        <v-avatar size="40" rounded="circle">
          <v-img src="/logo.jpg" alt="Logo"></v-img>
        </v-avatar>
        <v-toolbar-title class="ml-3 text-white">Joel Ai</v-toolbar-title>
        <v-spacer></v-spacer>
        <!-- Navigation links can go here -->
      </v-container>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

  </v-app>
</template>

<script setup>
// You can add any App-wide logic here later
</script>

<style scoped>
/* You can add global styles here later */
</style>