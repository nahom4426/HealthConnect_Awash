<script setup>
defineProps({
  title: {
    type: String,
    default: 'No Data Available'
  },
  message: {
    type: String,
    default: 'There are no items to display at the moment.'
  }
});
</script>

<template>
  <div class="animated-no-data-container">
    <!-- Animated SVG Illustration -->
    <div class="illustration-wrapper">
      <svg class="animated-illustration" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <!-- Animated background gradient circle -->
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e0e7ff;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#f0f4ff;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        
        <!-- Background circle with animation -->
        <circle class="bg-circle" cx="120" cy="120" r="110" fill="url(#bgGradient)" stroke="#e5e7eb" stroke-width="1.5" opacity="0.5"/>
        
        <!-- Floating documents with staggered animation -->
        <g class="document document-1">
          <rect x="50" y="45" width="55" height="80" rx="5" fill="#3b82f6" opacity="0.85" filter="drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))"/>
          <line x1="62" y1="65" x2="93" y2="65" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="62" y1="78" x2="93" y2="78" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="62" y1="91" x2="80" y2="91" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="62" y1="104" x2="93" y2="104" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round"/>
        </g>

        <g class="document document-2">
          <rect x="135" y="55" width="55" height="80" rx="5" fill="#8b5cf6" opacity="0.85" filter="drop-shadow(0 4px 8px rgba(139, 92, 246, 0.2))"/>
          <line x1="147" y1="75" x2="178" y2="75" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="147" y1="88" x2="178" y2="88" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="147" y1="101" x2="165" y2="101" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="147" y1="114" x2="178" y2="114" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round"/>
        </g>

        <!-- Animated search icon in center -->
        <g class="search-icon">
          <circle class="search-circle" cx="120" cy="120" r="28" fill="none" stroke="#6366f1" stroke-width="3" opacity="0.8"/>
          <line class="search-line" x1="142" y1="142" x2="160" y2="160" stroke="#6366f1" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        </g>

        <!-- Animated floating particles -->
        <circle class="particle particle-1" cx="70" cy="160" r="3.5" fill="#ec4899" opacity="0.7"/>
        <circle class="particle particle-2" cx="170" cy="150" r="3" fill="#06b6d4" opacity="0.7"/>
        <circle class="particle particle-3" cx="100" cy="190" r="2.5" fill="#f59e0b" opacity="0.7"/>
        <circle class="particle particle-4" cx="160" cy="70" r="2" fill="#10b981" opacity="0.6"/>
      </svg>
    </div>

    <!-- Text content with fade-in animation -->
    <div class="content-wrapper">
      <h3 class="title">{{ title }}</h3>
      <p class="message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.animated-no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1.5rem;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.illustration-wrapper {
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

.animated-illustration {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.08));
  animation: subtle-rotate 8s linear infinite;
}

@keyframes subtle-rotate {
  0%, 100% {
    transform: rotateZ(0deg);
  }
  50% {
    transform: rotateZ(1deg);
  }
}

/* Background circle animation */
.bg-circle {
  animation: circle-pulse 3s ease-in-out infinite;
  transform-origin: 120px 120px;
}

@keyframes circle-pulse {
  0%, 100% {
    r: 110;
    opacity: 0.5;
  }
  50% {
    r: 115;
    opacity: 0.3;
  }
}

/* Document animations with smooth floating */
.document {
  animation: float-smooth 3.5s ease-in-out infinite;
  transform-origin: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
}

.document-1 {
  animation-delay: 0s;
}

.document-2 {
  animation-delay: 0.6s;
}

@keyframes float-smooth {
  0%, 100% {
    transform: translateY(0px) translateX(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-12px) translateX(3px) rotate(1deg);
  }
  50% {
    transform: translateY(-18px) translateX(0px) rotate(2deg);
  }
  75% {
    transform: translateY(-12px) translateX(-3px) rotate(1deg);
  }
}

/* Search icon animations */
.search-icon {
  animation: search-pulse 2.5s ease-in-out infinite;
  transform-origin: 120px 120px;
}

.search-circle {
  animation: circle-scale 2.5s ease-in-out infinite;
  transform-origin: 120px 120px;
}

.search-line {
  animation: line-scale 2.5s ease-in-out infinite;
  transform-origin: 142px 142px;
}

@keyframes search-pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

@keyframes circle-scale {
  0%, 100% {
    r: 28;
    stroke-width: 3;
  }
  50% {
    r: 32;
    stroke-width: 2.5;
  }
}

@keyframes line-scale {
  0%, 100% {
    stroke-width: 3;
  }
  50% {
    stroke-width: 2.5;
  }
}

/* Particle animations with varied paths */
.particle {
  animation: particle-float 4.5s ease-in-out infinite;
}

.particle-1 {
  animation-delay: 0s;
}

.particle-2 {
  animation-delay: 1.1s;
}

.particle-3 {
  animation-delay: 2.2s;
}

.particle-4 {
  animation-delay: 3.3s;
}

@keyframes particle-float {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0.4;
  }
  25% {
    opacity: 0.7;
  }
  50% {
    transform: translateY(-25px) translateX(12px);
    opacity: 0.8;
  }
  75% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-35px) translateX(0px);
    opacity: 0.3;
  }
}

/* Content styling with animations */
.content-wrapper {
  text-align: center;
  max-width: 420px;
  animation: slideUp 0.8s ease-out 0.2s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.75rem;
  letter-spacing: -0.3px;
}

.message {
  margin: 0;
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  font-weight: 400;
}

/* Responsive design */
@media (max-width: 768px) {
  .animated-no-data-container {
    padding: 2.5rem 1rem;
    gap: 1.25rem;
  }

  .illustration-wrapper {
    width: 180px;
    height: 180px;
  }

  .title {
    font-size: 1.0625rem;
  }

  .message {
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .animated-no-data-container {
    padding: 2rem 1rem;
    gap: 1rem;
  }

  .illustration-wrapper {
    width: 160px;
    height: 160px;
  }

  .title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .message {
    font-size: 0.8125rem;
  }
}
</style>
