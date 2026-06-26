<script setup>
import { computed } from 'vue';
import LoginForm from "./LoginForm.vue";
import eicLogo from '../assets/img/logo.png';
import eicIllustration from '../assets/img/eic-bgremoved.png';
</script>

<template>
  <div class="login-wrapper">
    <!-- Animated SVG waves -->
    <div class="wave-container">
      <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
        <defs>
          <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g class="parallax">
          <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(27,42,94,0.05)" />
          <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(27,42,94,0.03)" />
          <use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(27,42,94,0.02)" />
          <use xlink:href="#gentle-wave" x="48" y="7" fill="rgba(27,42,94,0.1)" /> <!-- #1B2A5E with low opacity -->
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
.login-wrapper {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #F8F9FB 0%, #eef2f9 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-family: 'Inter', 'Poppins', system-ui, -apple-system, sans-serif;
}

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
  background-color: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  padding: 2rem;
  box-sizing: border-box;
}

.eic-illustration {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-info {
  color: #1B2A5E;
}

.brand-motto {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #D4AF37; /* soft gold */
  margin-bottom: 0.5rem;
}

.brand-name {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 0.5rem 0;
  color: #1B2A5E;
}

.brand-name-amharic {
  font-size: 1.4rem;
  font-weight: 700;
  color: #4A90D9; /* sky blue */
  margin-bottom: 1rem;
}

.brand-desc {
  font-size: 1rem;
  color: #475569;
  line-height: 1.6;
  max-width: 90%;
  margin: 0;
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(27, 42, 94, 0.1);
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(27, 42, 94, 0.1);
  animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
  overflow: hidden; /* Contains LoginForm */
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
  color: #1B2A5E; /* Navy text */
  font-weight: 500;
  letter-spacing: 0.02em;
  animation: cardEntrance 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.shield-icon {
  width: 16px;
  height: 16px;
  color: #D4AF37;
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
  color: #1B2A5E !important;
  font-size: 1.5rem;
}

:deep(.lf-subtitle) {
  color: #475569 !important;
}

:deep(.form-label), :deep(label) {
  color: #1B2A5E !important;
}

:deep(input:not([type='checkbox'])), :deep(textarea) {
  background: #ffffff !important;
  border: 1px solid rgba(27, 42, 94, 0.15) !important;
  color: #1B2A5E !important;
  border-radius: 12px !important;
  padding-right: 2.5rem !important;
}

:deep(input:not([type='checkbox']):focus) {
  background: #ffffff !important;
  border-color: #4A90D9 !important;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.25) !important;
}

:deep(.pw-toggle), :deep(.input-suffix button) {
  color: #1B2A5E !important;
  opacity: 0.6;
}

:deep(.pw-toggle:hover), :deep(.input-suffix button:hover) {
  opacity: 1;
}

:deep(.lf-remember) {
  color: #475569 !important;
}

:deep(.lf-remember:hover) {
  color: #1B2A5E !important;
}

:deep(.lf-forgot) {
  color: #D4AF37 !important; /* Soft gold accent */
}

:deep(.lf-forgot:hover) {
  color: #f1d471 !important;
}

:deep(.lf-submit-btn) {
  background: #D4AF37 !important; /* Soft gold for primary CTA */
  color: #1B2A5E !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3) !important;
}

:deep(.lf-submit-btn:hover) {
  background: #e2be4a !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4) !important;
}

:deep(.lf-btn-content) {
  color: #1B2A5E !important;
}

:deep(.lf-trust) {
  display: none; /* Hide internal trust strip, we have the footer */
}

:deep(.lf-footer) {
  display: none; /* Hide internal footer */
}

/* Success overlay adjustments */
:deep(.lf-success-overlay) {
  background: rgba(27, 42, 94, 0.95) !important; /* Deep navy */
}
</style>
