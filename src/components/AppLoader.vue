<template>
  <div class="app-loader" v-if="isLoading" :class="{ 'fade-out': isComplete }">
    <!-- Animated gradient background -->
    <div class="gradient-bg"></div>
    
    <!-- Floating particles -->
    <div class="particles">
      <div v-for="n in 20" :key="n" class="particle" :style="particleStyle(n)"></div>
    </div>
    
    <!-- Main loader container -->
    <div class="loader-compact">
      <!-- Logo with holographic effect -->
      <div class="logo-compact">
        <div class="logo-orb">
          <div class="logo-core">
            <img src="/src/assets/img/letter-logo.png " alt="Nyala Insurance" class="logo" />
          </div>
          <div class="ring-1 logo-ring"></div>
          <div class="ring-2 logo-ring"></div>
          <div class="logo-ring ring-3"></div>
          <div class="logo-glow"></div>
        </div>
      </div>
      
      <!-- Compact loading indicator -->
      <div class="loading-mini">
        <div class="mini-rings">
          <div class="mini-ring"></div>
          <div class="mini-ring"></div>
          <div class="mini-ring"></div>
        </div>
        <div class="mini-center">
          <div class="mini-pulse"></div>
        </div>
      </div>
      
      <!-- Compact content -->
      <div class="content-compact">
        <!-- Animated title -->
        <div class="title-compact">
          <h1 class="compact-title">
            <span class="title-gradient">Awash</span>
            <span class="title-solid">Insurance</span>
          </h1>
        </div>
        
        <!-- Status with dots -->
        <div class="status-compact">
          <div class="status-text">{{ loadingMessage }}</div>
          <div class="status-dots">
            <span class="dot" :class="{ 'active': dotActive[0] }"></span>
            <span class="dot" :class="{ 'active': dotActive[1] }"></span>
            <span class="dot" :class="{ 'active': dotActive[2] }"></span>
          </div>
        </div>
        
        <!-- Compact progress -->
        <div class="progress-compact">
          <div class="progress-header">
            <span class="progress-label">Loading System</span>
            <span class="progress-value">{{ Math.round(progress) }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: progress + '%' }">
              <div class="progress-shine"></div>
            </div>
            <div class="progress-markers">
              <div class="marker" :class="{ 'active': progress >= 0 }"></div>
              <div class="marker" :class="{ 'active': progress >= 25 }"></div>
              <div class="marker" :class="{ 'active': progress >= 50 }"></div>
              <div class="marker" :class="{ 'active': progress >= 75 }"></div>
              <div class="marker" :class="{ 'active': progress >= 100 }"></div>
            </div>
          </div>
        </div>
        
        <!-- Mini metrics -->
        <div class="metrics-compact">
          <div class="metric-item">
            <div class="metric-icon">✓</div>
            <div class="metric-data">
              <div class="metric-value">Secure</div>
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-icon">⚡</div>
            <div class="metric-data">
              <div class="metric-value">{{ Math.round(loadSpeed) }}ms</div>
            </div>
          </div>
          <div class="metric-item">
            <div class="metric-icon">🛡️</div>
            <div class="metric-data">
              <div class="metric-value">256-bit</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Compact footer -->
      <div class="footer-compact">
        <span class="footer-tag">Medcoanalytics</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, computed, watch } from 'vue';

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: true
  }
});

const progress = ref(0);
const loadingMessage = ref('Initializing...');
const loadSpeed = ref(0);
const dotActive = ref([true, false, false]);
const isComplete = ref(false);

const messages = [
  'Initializing...',
  'Loading modules...',
  'Securing connection...',
  'Optimizing...',
  'Finalizing...',
  'Ready to launch!'
];

// Generate particle styles
const particleStyle = (index) => {
  const size = Math.random() * 3 + 1;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const duration = Math.random() * 10 + 5;
  const delay = Math.random() * 3;
  const hue = Math.random() * 60 + 200;
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    background: `radial-gradient(circle, hsl(${hue}, 100%, 70%) 0%, transparent 70%)`,
    opacity: Math.random() * 0.3 + 0.1
  };
};

let progressInterval;
let dotInterval;

const startProgress = () => {
  let messageIndex = 0;
  let currentProgress = 0;
  
  // Animate loading dots
  dotInterval = setInterval(() => {
    dotActive.value = dotActive.value.map((_, i) => i === Math.floor(Date.now() / 500) % 3);
  }, 500);
  
  // Simulate load speed
  loadSpeed.value = 500;
  
  const updateProgress = () => {
    if (currentProgress < 95) {
      // Smooth progress
      const increment = 0.4 + Math.random() * 2;
      currentProgress = Math.min(currentProgress + increment, 95);
      progress.value = Math.round(currentProgress * 10) / 10;
      
      // Update message
      const newMessageIndex = Math.min(
        Math.floor((progress.value / 95) * (messages.length - 1)),
        messages.length - 1
      );
      if (newMessageIndex !== messageIndex) {
        messageIndex = newMessageIndex;
        loadingMessage.value = messages[messageIndex];
      }
      
      // Improve speed as progress increases
      if (loadSpeed.value > 50) {
        loadSpeed.value = Math.max(500 - currentProgress * 4.5, 50);
      }
    } else {
      clearInterval(progressInterval);
    }
  };
  
  progressInterval = setInterval(updateProgress, 30);
};

const complete = () => {
  isComplete.value = true;
  clearInterval(progressInterval);
  clearInterval(dotInterval);
  
  // Smooth final animation
  const finalize = () => {
    if (progress.value < 100) {
      progress.value = Math.min(progress.value + 1, 100);
      setTimeout(finalize, 20);
    } else {
      loadingMessage.value = 'Ready!';
      loadSpeed.value = 42;
      dotActive.value = [true, true, true];
    }
  };
  finalize();
};

onMounted(() => {
  if (props.isLoading) {
    setTimeout(startProgress, 300);
  }
});

defineExpose({
  complete,
  startProgress
});
</script>

<style scoped>
.app-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, 
    #0a0a1a 0%, 
    #15152b 50%, 
    #0f0f23 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Gradient background */
.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
  opacity: 0.7;
}

/* Particles */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-40px) translateX(20px);
  }
  50% {
    transform: translateY(-80px) translateX(-20px);
  }
  75% {
    transform: translateY(-40px) translateX(-20px);
  }
}

/* Compact loader container */
.loader-compact {
  position: relative;
  width: 90%;
  max-width: 400px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.03),
    0 0 60px rgba(99, 102, 241, 0.15);
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.loader-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Compact logo */
.logo-compact {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
}

.logo-orb {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-core {
  position: relative;
  width: 50px;
  height: 50px;
  z-index: 3;
  animation: logoFloat 6s ease-in-out infinite;
}

.logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.logo-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1px solid;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 80px;
  height: 80px;
  border-color: rgba(99, 102, 241, 0.3);
  animation: ringSpin 8s linear infinite;
}

.ring-2 {
  width: 70px;
  height: 70px;
  border-color: rgba(139, 92, 246, 0.4);
  animation: ringSpin 6s linear infinite reverse;
}

.ring-3 {
  width: 60px;
  height: 60px;
  border-color: rgba(59, 130, 246, 0.3);
  animation: ringSpin 4s linear infinite;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, 
    rgba(99, 102, 241, 0.2) 0%,
    transparent 70%);
  transform: translate(-50%, -50%);
  filter: blur(10px);
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(180deg); }
}

@keyframes ringSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.8; }
}

/* Compact loading indicator */
.loading-mini {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
}

.mini-rings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.mini-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border: 1.5px solid;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: miniRingSpin linear infinite;
}

.mini-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  border-color: rgba(99, 102, 241, 0.3);
  animation-duration: 6s;
}

.mini-ring:nth-child(2) {
  width: 75%;
  height: 75%;
  border-color: rgba(139, 92, 246, 0.4);
  animation-duration: 4s;
  animation-direction: reverse;
}

.mini-ring:nth-child(3) {
  width: 50%;
  height: 50%;
  border-color: rgba(59, 130, 246, 0.5);
  animation-duration: 2s;
}

.mini-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.mini-pulse {
  width: 16px;
  height: 16px;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  animation: miniPulse 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.8);
}

@keyframes miniRingSpin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes miniPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* Compact content */
.content-compact {
  margin-bottom: 1.5rem;
}

.title-compact {
  margin-bottom: 1rem;
}

.compact-title {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
  margin: 0;
}

.title-gradient {
  display: block;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 100%;
  animation: gradientShift 3s ease infinite;
}

.title-solid {
  display: block;
  color: white;
  font-size: 1.8rem;
  opacity: 0.9;
}

/* Status */
.status-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.status-text {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.3px;
}

.status-dots {
  display: flex;
  gap: 0.4rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.dot.active {
  background: #6366f1;
  box-shadow: 0 0 8px #6366f1;
  transform: scale(1.2);
}

/* Compact progress */
.progress-compact {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.progress-value {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-track {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  margin-bottom: 0.5rem;
}

.progress-bar {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, 
    #6366f1 0%, 
    #8b5cf6 50%, 
    #d946ef 100%);
  border-radius: 3px;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
  overflow: hidden;
}

.progress-shine {
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.6) 50%, 
    transparent 100%);
  animation: shineMove 2s infinite linear;
}

.progress-markers {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.marker {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s ease;
}

.marker.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
  transform: scale(1.2);
}

/* Compact metrics */
.metrics-compact {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.metric-item:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-1px);
}

.metric-icon {
  font-size: 1rem;
  opacity: 0.8;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-data {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

/* Footer */
.footer-compact {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.footer-tag {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Animations */
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes shineMove {
  0% { transform: translateX(-60px); }
  100% { transform: translateX(calc(100% + 60px)); }
}

/* Fade out animation */
.fade-out {
  animation: fadeOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: scale(0.95);
    visibility: hidden;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .loader-compact {
    padding: 1.5rem;
    max-width: 350px;
  }
  
  .compact-title {
    font-size: 1.8rem;
  }
  
  .title-solid {
    font-size: 1.5rem;
  }
  
  .loading-mini {
    width: 80px;
    height: 80px;
  }
  
  .logo-compact {
    width: 70px;
    height: 70px;
  }
  
  .progress-compact {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .loader-compact {
    padding: 1.25rem;
    max-width: 280px;
    border-radius: 20px;
  }
  
  .compact-title {
    font-size: 1.5rem;
  }
  
  .title-solid {
    font-size: 1.2rem;
  }
  
  .loading-mini {
    width: 70px;
    height: 70px;
    margin-bottom: 1rem;
  }
  
  .logo-compact {
    width: 60px;
    height: 60px;
    margin-bottom: 1rem;
  }
  
  .progress-compact {
    padding: 0.75rem;
  }
  
  .metrics-compact {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .metric-item {
    padding: 0.5rem;
  }
  
  .metric-value {
    font-size: 0.75rem;
  }
}
</style>