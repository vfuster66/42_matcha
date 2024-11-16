<template>
  <div class="login-page">
    <h1>Bienvenue</h1>
    <p>Connectez-vous ou inscrivez-vous pour continuer.</p>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email :</label>
        <input id="email" type="email" v-model="email" required />
      </div>
      <div>
        <label for="password">Mot de passe :</label>
        <input id="password" type="password" v-model="password" required />
      </div>
      <button type="submit">Se connecter</button>
    </form>
    <p>
      Pas encore de compte ?
      <button @click="navigateToRegister">S'inscrire</button>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

const handleSubmit = () => {
  console.log('Email:', email.value, 'Password:', password.value);
  // Ajouter la logique de connexion ici
};

const navigateToRegister = () => {
  router.push('/register'); // Navigue vers la page d'inscription
};
</script>

<style scoped>
.login-page {
  text-align: center;
  margin-top: 50px;
}
</style>
