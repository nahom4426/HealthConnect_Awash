import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useDarkModeStore = defineStore('darkMode', () => {
  const isDark = ref(localStorage.getItem('eic-dark-mode') === 'true');

  watch(isDark, (val) => {
    localStorage.setItem('eic-dark-mode', String(val));
    // Both hooks: `.dark` for the module/login screens, data-theme for the
    // design tokens in assets/wind.css and theme-dark.css.
    const root = document.documentElement;
    root.classList.toggle('dark', val);
    root.dataset.theme = val ? 'dark' : 'light';
    root.style.colorScheme = val ? 'dark' : 'light';
  }, { immediate: true });

  function toggle() {
    isDark.value = !isDark.value;
  }

  return { isDark, toggle };
});
