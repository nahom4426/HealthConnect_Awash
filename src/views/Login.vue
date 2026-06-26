<script setup>
import { computed } from 'vue';
import LoginForm from "./LoginForm.vue";
import eicLogo from '../assets/img/logo.png';
import eicIllustration from '../assets/img/eic-bgremoved.png';
import { useDarkModeStore } from '../stores/darkMode';

const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);
</script>

<template>
  <div class="login-wrapper" :class="{ dark: isDark }">

    <!-- Dark mode toggle -->
    <button class="dark-toggle" @click="darkStore.toggle()" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/><path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    </button>

    <!-- Animated SVG waves -->
    <div class="wave-container">
      <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
        <defs>
          <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g class="parallax">
          <use xlink:href="#gentle-wave" x="48" y="0" class="wave-1" />
          <use xlink:href="#gentle-wave" x="48" y="3" class="wave-2" />
          <use xlink:href="#gentle-wave" x="48" y="5" class="wave-3" />
          <use xlink:href="#gentle-wave" x="48" y="7" class="wave-4" />
        </g>
      </svg>
    </div>

    <!-- Main Layout -->
    <div class="login-container">
      <!-- Left side branding -->
      <div class="login-left">
        <div class="illustration-circle">
          <img :src="eicIllustration" alt="EIC Illustration" class="eic-illustration" />
        </div>
        <div class="brand-info">
          <div class="brand-motto">Trusted Since 1976</div>
          <h1 class="brand-name">Ethiopian Insurance<br/>Corporation</h1>
          <div class="brand-name-amharic">የኢትዮጵያ መድን ድርጅት</div>
          <p class="brand-desc">
            One platform. Eight product lines. Real-time policies, instant claims,
            and enterprise analytics — all secured and unified under EIC.
          </p>
        </div>
      </div>

      <!-- Right side card -->
      <div class="login-right">
        <div class="glass-card">
          <div class="card-logo-wrapper">
            <img :src="eicLogo" alt="EIC Logo" class="card-logo" />
          </div>
          
          <!-- The form from the existing component -->
          <LoginForm />
        </div>

        <!-- Footer under the card -->
        <div class="login-footer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Protected by EIC Secure Login
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── CSS Variables for light/dark theming ── */
.login-wrapper {
  --bg-main: linear-gradient(180deg, #F8F9FB 0%, #eef2f9 100%);
  --wave-1: rgba(27,42,94,0.05);
  --wave-2: rgba(27,42,94,0.03);
  --wave-3: rgba(27,42,94,0.02);
  --wave-4: rgba(27,42,94,0.1);
  --circle-bg: #ffffff;
  --circle-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  --brand-color: #1B2A5E;
  --brand-motto: #D4AF37;
  --brand-amharic: #4A90D9;
  --brand-desc: #475569;
  --card-bg: rgba(255, 255, 255, 0.9);
  --card-border: rgba(27, 42, 94, 0.1);
  --card-shadow: 0 15px 35px rgba(27, 42, 94, 0.1);
  --footer-color: #1B2A5E;
  --shield-color: #D4AF37;
  --input-bg: #ffffff;
  --input-border: rgba(27, 42, 94, 0.15);
  --input-color: #1B2A5E;
  --input-focus-border: #4A90D9;
  --input-focus-shadow: 0 0 0 3px rgba(74, 144, 217, 0.25);
  --label-color: #1B2A5E;
  --subtitle-color: #475569;
  --toggle-bg: rgba(255,255,255,0.85);
  --toggle-border: rgba(27,42,94,0.15);
  --toggle-color: #1B2A5E;
  --forgot-color: #D4AF37;
  --forgot-hover: #f1d471;
  --btn-bg: #D4AF37;
  --btn-color: #1B2A5E;
  --btn-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  --btn-hover-bg: #e2be4a;
  --btn-hover-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
  --remember-color: #475569;
  --remember-hover: #1B2A5E;
  --success-bg: rgba(27, 42, 94, 0.95);
}

.login-wrapper.dark {
  --bg-main: linear-gradient(180deg, #0a0e1a 0%, #111827 100%);
  --wave-1: rgba(99,102,241,0.08);
  --wave-2: rgba(99,102,241,0.05);
  --wave-3: rgba(99,102,241,0.03);
  --wave-4: rgba(99,102,241,0.12);
  --circle-bg: rgba(255,255,255,0.06);
  --circle-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  --brand-color: #f1f5f9;
  --brand-motto: #818cf8;
  --brand-amharic: #60a5fa;
  --brand-desc: rgba(255,255,255,0.6);
  --card-bg: rgba(255, 255, 255, 0.06);
  --card-border: rgba(255, 255, 255, 0.1);
  --card-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99,102,241,0.1);
  --footer-color: rgba(255,255,255,0.6);
  --shield-color: #818cf8;
  --input-bg: rgba(255,255,255,0.06);
  --input-border: rgba(255,255,255,0.12);
  --input-color: #f1f5f9;
  --input-focus-border: #6366f1;
  --input-focus-shadow: 0 0 0 3px rgba(99,102,241,0.25);
  --label-color: rgba(255,255,255,0.7);
  --subtitle-color: rgba(255,255,255,0.5);
  --toggle-bg: rgba(255,255,255,0.08);
  --toggle-border: rgba(255,255,255,0.15);
  --toggle-color: rgba(255,255,255,0.7);
  --forgot-color: #818cf8;
  --forgot-hover: #a5b4fc;
  --btn-bg: linear-gradient(135deg, #4f46e5, #6366f1);
  --btn-color: #ffffff;
  --btn-shadow: 0 4px 20px rgba(99,102,241,0.35);
  --btn-hover-bg: linear-gradient(135deg, #6366f1, #818cf8);
  --btn-hover-shadow: 0 6px 28px rgba(99,102,241,0.5);
  --remember-color: rgba(255,255,255,0.45);
  --remember-hover: rgba(255,255,255,0.85);
  --success-bg: rgba(10, 14, 26, 0.95);
}

.login-wrapper {
  position: relative;
  min-height: 100vh;
  background: var(--bg-main);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-family: 'Inter', 'Poppins', system-ui, -apple-system, sans-serif;
  transition: background 0.4s ease;
}

/* ── Dark Mode Toggle ── */
.dark-toggle {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 100;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1.5px solid var(--toggle-border);
  background: var(--toggle-bg);
  color: var(--toggle-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.dark-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 20px rgba(99,102,241,0.3);
}
.dark-toggle svg { width: 18px; height: 18px; }

/* Waves at the bottom */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20vh;
  min-height: 100px;
  max-height: 250px;
  z-index: 0;
}

.waves {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.wave-1 { fill: var(--wave-1); }
.wave-2 { fill: var(--wave-2); }
.wave-3 { fill: var(--wave-3); }
.wave-4 { fill: var(--wave-4); }

.parallax > use {
  animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
}
.parallax > use:nth-child(1) {
  animation-delay: -2s;
  animation-duration: 7s;
}
.parallax > use:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 10s;
}
.parallax > use:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 13s;
}
.parallax > use:nth-child(4) {
  animation-delay: -5s;
  animation-duration: 20s;
}

@keyframes move-forever {
  0% { transform: translate3d(-90px,0,0); }
  100% { transform: translate3d(85px,0,0); }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 4rem;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
}

@media (max-width: 968px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 480px;
    gap: 2rem;
  }
  .login-left {
    display: none;
  }
}

.login-left {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.illustration-circle {
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1 / 1;
  background-color: var(--circle-bg);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--circle-shadow);
  padding: 2rem;
  box-sizing: border-box;
  transition: background-color 0.4s ease, box-shadow 0.4s ease;
}

.eic-illustration {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-info {
  color: var(--brand-color);
  transition: color 0.4s ease;
}

.brand-motto {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--brand-motto);
  margin-bottom: 0.5rem;
  transition: color 0.4s ease;
}

.brand-name {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 0.5rem 0;
  color: var(--brand-color);
  transition: color 0.4s ease;
}

.brand-name-amharic {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--brand-amharic);
  margin-bottom: 1rem;
  transition: color 0.4s ease;
}

.brand-desc {
  font-size: 1rem;
  color: var(--brand-desc);
  line-height: 1.6;
  max-width: 90%;
  margin: 0;
  transition: color 0.4s ease;
}

.login-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.glass-card {
  width: 100%;
  max-width: 420px;
  background: var(--card-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  overflow: hidden; /* Contains LoginForm */
  transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
}

@keyframes cardEntrance {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1.5rem 0;
}

.card-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
  /* Add a soft glow behind the logo */
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.2));
}

.login-footer {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--footer-color);
  font-weight: 500;
  letter-spacing: 0.02em;
  animation: cardEntrance 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  transition: color 0.4s ease;
}

.shield-icon {
  width: 16px;
  height: 16px;
  color: var(--shield-color);
  transition: color 0.4s ease;
}

/* Deep overrides to make LoginForm match the glass card theme */
:deep(.lf-root) {
  /* Override any internal background */
  background: transparent !important;
}

:deep(.lf-body) {
  padding: 1rem 2rem 2rem;
}

:deep(.lf-header) {
  margin-bottom: 1.5rem;
}

:deep(.lf-header-icon) {
  display: none; /* Hide internal icon since we have EIC logo */
}

:deep(.lf-title) {
  color: var(--brand-color) !important;
  font-size: 1.5rem;
  transition: color 0.4s ease;
}

:deep(.lf-subtitle) {
  color: var(--subtitle-color) !important;
  transition: color 0.4s ease;
}

:deep(.form-label), :deep(label) {
  color: var(--label-color) !important;
  transition: color 0.4s ease;
}

:deep(input:not([type='checkbox'])), :deep(textarea) {
  background: var(--input-bg) !important;
  border: 1px solid var(--input-border) !important;
  color: var(--input-color) !important;
  border-radius: 12px !important;
  padding-right: 2.5rem !important;
  transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease;
}

:deep(input:not([type='checkbox']):focus) {
  background: var(--input-bg) !important;
  border-color: var(--input-focus-border) !important;
  box-shadow: var(--input-focus-shadow) !important;
}

:deep(input::placeholder),
:deep(textarea::placeholder) {
  color: var(--subtitle-color) !important;
  transition: color 0.4s ease;
}

:deep(.pw-toggle), :deep(.input-suffix button) {
  color: var(--brand-color) !important;
  opacity: 0.6;
  transition: color 0.4s ease;
}

:deep(.pw-toggle:hover), :deep(.input-suffix button:hover) {
  opacity: 1;
}

:deep(.lf-remember) {
  color: var(--remember-color) !important;
  transition: color 0.4s ease;
}

:deep(.lf-remember:hover) {
  color: var(--remember-hover) !important;
}

:deep(.lf-forgot) {
  color: var(--forgot-color) !important;
  transition: color 0.4s ease;
}

:deep(.lf-forgot:hover) {
  color: var(--forgot-hover) !important;
}

:deep(.lf-submit-btn) {
  background: var(--btn-bg) !important;
  color: var(--btn-color) !important;
  border-radius: 12px !important;
  box-shadow: var(--btn-shadow) !important;
  transition: background 0.4s ease, color 0.4s ease, box-shadow 0.3s ease, transform 0.15s ease;
}

:deep(.lf-submit-btn:hover) {
  background: var(--btn-hover-bg) !important;
  transform: translateY(-2px);
  box-shadow: var(--btn-hover-shadow) !important;
}

:deep(.lf-btn-content) {
  color: var(--btn-color) !important;
  transition: color 0.4s ease;
}

:deep(.lf-trust) {
  display: none; /* Hide internal trust strip, we have the footer */
}

:deep(.lf-footer) {
  display: none; /* Hide internal footer */
}

/* Success overlay adjustments */
:deep(.lf-success-overlay) {
  background: var(--success-bg) !important;
}
</style>
