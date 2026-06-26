import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useDarkModeStore = defineStore('darkMode', () => {
  const isDark = ref(localStorage.getItem('eic-dark-mode') === 'true');

  watch(isDark, (val) => {
    localStorage.setItem('eic-dark-mode', String(val));
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, { immediate: true });

  function toggle() {
    isDark.value = !isDark.value;
  }

  return { isDark, toggle };
});
