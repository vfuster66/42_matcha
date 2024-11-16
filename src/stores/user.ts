import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);

  function setUser(newUser: any) {
    user.value = newUser;
  }

  function clearUser() {
    user.value = null;
  }

  return { user, setUser, clearUser };
});

