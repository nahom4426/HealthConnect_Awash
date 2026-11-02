import '../assets/wind.css';
import '../assets/theme-dark.css';
import '../assets/theme-dark-tints.css';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { applyTheme, isDark } from './theme';

// The saved theme goes on <html> before the first paint
applyTheme(isDark());

createApp(App).use(router).mount('#app');
