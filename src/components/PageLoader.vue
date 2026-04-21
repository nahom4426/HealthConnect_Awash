<template>
  <div class="page-loader-container">
    <div class="loader-content">
      <!-- Option 1: Elegant Dots (default) -->
      <div v-if="variant === 'dots'" class="dots-spinner">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>

      <!-- Option 2: Smooth Ring -->
      <div v-else-if="variant === 'ring'" class="ring-spinner">
        <div class="ring"></div>
      </div>

      <!-- Option 3: Pulse Wave -->
      <div v-else-if="variant === 'pulse'" class="pulse-spinner">
        <div class="pulse"></div>
      </div>

      <!-- Option 4: Morphing Circles -->
      <div v-else-if="variant === 'morph'" class="morph-spinner">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>

      <div class="loading-info">
        <h2 class="loading-title">{{ title }}</h2>
        <p class="loading-subtitle">{{ subtitle }}</p>
        <div v-if="showProgress" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  title?: string;
  subtitle?: string;
  variant?: 'dots' | 'ring' | 'pulse' | 'morph';
  showProgress?: boolean;
  progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Loading",
  subtitle: "Please wait a moment",
  variant: "dots",
  showProgress: false,
  progress: 0
});

// Optional: Auto-increment progress for demo purposes
const demoProgress = ref(0);
if (props.showProgress && props.progress === 0) {
  const interval = setInterval(() => {
    if (demoProgress.value >= 100) {
      clearInterval(interval);
      return;
    }
    demoProgress.value += Math.random() * 10;
    if (demoProgress.value > 100) demoProgress.value = 100;
  }, 300);
}
</script>

<style scoped>
.page-loader-container {
  @apply flex flex-col justify-center items-center min-h-[400px] w-full bg-gradient-to-br from-white via-gray-50 to-gray-100 backdrop-blur-sm rounded-xl shadow-sm;
}

.loader-content {
  @apply flex flex-col items-center gap-8 p-8;
}

/* ===== Option 1: Elegant Dots ===== */
.dots-spinner {
  @apply flex items-center justify-center gap-2;
  height: 60px;
}

.dots-spinner .dot {
  @apply w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dots-spinner .dot:nth-child(1) { animation-delay: -0.32s; }
.dots-spinner .dot:nth-child(2) { animation-delay: -0.16s; }
.dots-spinner .dot:nth-child(3) { animation-delay: -0.08s; }
.dots-spinner .dot:nth-child(4) { animation-delay: 0s; }

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* ===== Option 2: Smooth Ring ===== */
.ring-spinner {
  @apply w-20 h-20;
}

.ring-spinner .ring {
  @apply w-full h-full rounded-full border-4 border-transparent;
  border-top-color: #3b82f6;
  border-right-color: #8b5cf6;
  border-bottom-color: #ec4899;
  border-left-color: #10b981;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== Option 3: Pulse Wave ===== */
.pulse-spinner {
  @apply w-20 h-20;
}

.pulse-spinner .pulse {
  @apply w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ===== Option 4: Morphing Circles ===== */
.morph-spinner {
  @apply relative w-20 h-20;
}

.morph-spinner .circle {
  @apply absolute top-0 left-0 w-full h-full rounded-full;
  background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #10b981, #3b82f6);
  animation: morph 3s ease-in-out infinite;
}

.morph-spinner .circle-1 {
  animation-delay: 0s;
  opacity: 0.7;
}
.morph-spinner .circle-2 {
  animation-delay: 0.5s;
  opacity: 0.5;
}
.morph-spinner .circle-3 {
  animation-delay: 1s;
  opacity: 0.3;
}

@keyframes morph {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    border-radius: 50%;
  }
  25% {
    transform: scale(0.8) rotate(90deg);
    border-radius: 40% 60% 60% 40%;
  }
  50% {
    transform: scale(1.1) rotate(180deg);
    border-radius: 30% 70% 70% 30%;
  }
  75% {
    transform: scale(0.9) rotate(270deg);
    border-radius: 60% 40% 40% 60%;
  }
}

/* ===== Progress Bar ===== */
.progress-container {
  @apply w-64 mt-4;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300;
}

.progress-text {
  @apply block text-xs text-gray-600 font-medium mt-2 text-center;
}

/* ===== Loading Text ===== */
.loading-info {
  @apply flex flex-col items-center gap-2 text-center;
}

.loading-title {
  @apply text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent;
  animation: textGlow 2s ease-in-out infinite;
}

.loading-subtitle {
  @apply text-sm text-gray-500 font-medium;
}

@keyframes textGlow {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .loader-content {
    @apply gap-6 p-6;
  }
  
  .ring-spinner,
  .pulse-spinner,
  .morph-spinner {
    @apply w-16 h-16;
  }
  
  .dots-spinner {
    height: 50px;
  }
}
</style>