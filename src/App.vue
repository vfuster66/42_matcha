<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-blue-500 text-white">
    <header class="text-center mb-4">
      <h1 class="text-4xl font-bold">Vérification de Tailwind CSS</h1>
      <p class="text-lg mt-2">Si ce texte est blanc et le fond est bleu, Tailwind fonctionne !</p>
    </header>

    <!-- Contenu principal des routes -->
    <main class="w-full p-4">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* Aucun style personnalisé n'est requis pour ce test */
</style>
