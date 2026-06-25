<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import LoginForm from "./LoginForm.vue";
import awashLogo from '../assets/img/awashlogo.svg';

const activeProduct = ref(0);
let rotateTimer = null;

const particles = ref([]);

const stats = [
  { value: '500K+', label: 'Policies Issued' },
  { value: '8',     label: 'Product Lines' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<2min', label: 'Claim Response' },
];

const generateParticles = () => {
  const list = [];
  for (let i = 0; i < 22; i++) {
    list.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3.5 + 1.5,
      duration: Math.random() * 22 + 12,
      delay: Math.random() * 12,
      opacity: Math.random() * 0.25 + 0.08
    });
  }
  particles.value = list;
};

const products = [
  {
    id: 'health',
    name: 'Health Insurance',
    tagline: 'Comprehensive Medical Coverage',
    desc: 'Full coverage for individuals and families — outpatient, inpatient, dental, and vision care with nationwide network hospitals.',
    color: '#10b981',
    grad: 'from-emerald-500 to-teal-600',
    bg: 'rgba(16,185,129,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
  },
  {
    id: 'motor',
    name: 'Motor Insurance',
    tagline: 'Drive with Confidence',
    desc: 'Third-party liability, comprehensive, and fleet coverage. Instant claims processing with 24/7 roadside assistance.',
    color: '#6366f1',
    grad: 'from-indigo-500 to-violet-600',
    bg: 'rgba(99,102,241,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>`,
  },
  {
    id: 'fire',
    name: 'Fire Insurance',
    tagline: 'Protect What Matters Most',
    desc: 'Covers buildings, contents, and assets against fire, lightning, explosion, and allied perils with rapid assessment.',
    color: '#f59e0b',
    grad: 'from-amber-500 to-orange-600',
    bg: 'rgba(245,158,11,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>`,
  },
  {
    id: 'marine',
    name: 'Marine Insurance',
    tagline: 'Secure Your Cargo & Fleet',
    desc: 'Comprehensive marine cargo, hull, and freight liability. Protect goods in transit across sea, air, and land routes.',
    color: '#0ea5e9',
    grad: 'from-sky-500 to-blue-600',
    bg: 'rgba(14,165,233,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 17l9-13 9 13M3 17h18M12 4v13"/></svg>`,
  },
  {
    id: 'life',
    name: 'Life Insurance',
    tagline: 'Securing Your Family\'s Future',
    desc: 'Term life, whole life, and endowment plans. Guaranteed payouts to protect loved ones and build long-term savings.',
    color: '#8b5cf6',
    grad: 'from-violet-500 to-purple-700',
    bg: 'rgba(139,92,246,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  },
  {
    id: 'engineering',
    name: 'Engineering Insurance',
    tagline: 'Coverage for Complex Projects',
    desc: 'Erection all risk, contractors all risk, and machinery breakdown. Tailored for construction and industrial operations.',
    color: '#f97316',
    grad: 'from-orange-500 to-red-600',
    bg: 'rgba(249,115,22,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
  {
    id: 'liability',
    name: 'Liability Insurance',
    tagline: 'Shield Against Legal Risk',
    desc: 'Public liability, product liability, professional indemnity, and employer\'s liability for businesses of all sizes.',
    color: '#ec4899',
    grad: 'from-pink-500 to-rose-600',
    bg: 'rgba(236,72,153,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>`,
  },
  {
    id: 'burglary',
    name: 'Burglary Insurance',
    tagline: 'Guard Against Theft & Loss',
    desc: 'Covers loss of property due to theft, burglary, and housebreaking. Available for homes, businesses, and cash in transit.',
    color: '#14b8a6',
    grad: 'from-teal-500 to-cyan-600',
    bg: 'rgba(20,184,166,0.12)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
  },
];

onMounted(() => {
  generateParticles();
  rotateTimer = setInterval(() => {
    activeProduct.value = (activeProduct.value + 1) % products.length;
  }, 3200);
});

onBeforeUnmount(() => {
  clearInterval(rotateTimer);
});

function stopRotate() {
  clearInterval(rotateTimer);
  rotateTimer = null;
}
</script>

<template>
  <div class="login-root">
    <!-- Enhanced Animated Background -->
    <div class="login-bg">
      <!-- Gradient Orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      <div class="orb orb-5"></div>
      <div class="orb orb-6"></div>
      
      <!-- Animated Grid -->
      <div class="grid-overlay"></div>
      
      <!-- Floating Particles -->
      <div 
        v-for="particle in particles" 
        :key="particle.id"
        class="floating-particle"
        :style="{
          left: particle.x + '%',
          top: particle.y + '%',
          width: particle.size + 'px',
          height: particle.size + 'px',
          opacity: particle.opacity,
          animationDuration: particle.duration + 's',
          animationDelay: particle.delay + 's'
        }"
      ></div>
      
    </div>

    <!-- Main Layout -->
    <div class="login-layout">
      <!-- LEFT: Enhanced Brand Section -->
      <div class="login-left">
        <!-- Logo with Glass Effect -->
        <div class="brand-row">
          <div class="brand-logo-wrap">
            <img :src="awashLogo" alt="Awash Insurance" class="brand-logo-img" />
          </div>
          <div>
            <div class="brand-name">Awash Insurance</div>
            <div class="brand-sub">Unified Insurance Platform</div>
          </div>
        </div>

        <!-- Animated Headline -->
        <div class="headline-block">
          <h1 class="headline-h1">
            Complete Insurance<br/>
            <span class="headline-gradient">Management Suite</span>
          </h1>
          <p class="headline-p">
            One platform. Eight product lines. Real-time policies, instant claims, and enterprise analytics — all secured and unified.
          </p>
        </div>

        <!-- Enhanced Product Showcase -->
        <Transition name="product-slide" mode="out-in">
          <div 
            :key="activeProduct"
            class="product-showcase"
            :style="{ 
              background: products[activeProduct].bg,
              borderColor: products[activeProduct].color + '40'
            }"
          >
            <div class="product-showcase-top">
              <div 
                class="product-icon-wrap"
                :style="{ 
                  background: `linear-gradient(135deg, ${products[activeProduct].color}, ${products[activeProduct].color}dd)`,
                  boxShadow: `0 0 30px ${products[activeProduct].color}40`
                }"
              >
                <span v-html="products[activeProduct].icon" class="product-icon-svg"></span>
              </div>
              <div>
                <div class="product-name" :style="{ color: products[activeProduct].color }">
                  {{ products[activeProduct].name }}
                </div>
                <div class="product-tagline">{{ products[activeProduct].tagline }}</div>
              </div>
            </div>
            <p class="product-desc">{{ products[activeProduct].desc }}</p>
            
            <!-- Enhanced Dot Indicators -->
            <div class="product-dots">
              <button
                v-for="(p, i) in products"
                :key="p.id"
                class="product-dot"
                :class="{ 'product-dot-active': i === activeProduct }"
                :style="i === activeProduct ? { background: products[activeProduct].color, boxShadow: `0 0 10px ${products[activeProduct].color}` } : {}"
                @click="activeProduct = i; clearInterval(rotateTimer)"
              />
            </div>
          </div>
        </Transition>

        <!-- Stats row -->
        <div class="stats-row">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>

        <!-- Product Pills -->
        <div class="product-pills">
          <button
            v-for="(p, i) in products"
            :key="p.id"
            class="product-pill"
            :class="{ 'product-pill-active': i === activeProduct }"
            :style="i === activeProduct ? { 
              background: p.color + '22', 
              borderColor: p.color + '80', 
              color: p.color,
              boxShadow: `0 0 20px ${p.color}30`
            } : {}"
            @click="activeProduct = i; stopRotate()"
          >
            <span v-html="p.icon" class="pill-icon"></span>
            {{ p.name }}
          </button>
        </div>

        <!-- Trust Badges -->
        <div class="trust-row">
          <div class="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            ISO 27001 Certified
          </div>
          <span class="trust-sep">•</span>
          <div class="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            256-bit Encryption
          </div>
          <span class="trust-sep">•</span>
          <div class="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            99.9% Uptime SLA
          </div>
        </div>
      </div>

      <!-- RIGHT: Enhanced Glass Card -->
      <div class="login-right">
        <div class="login-glass">
          <div class="login-glass-header">
            <div class="login-glass-dot" style="background:#ff5f57"></div>
            <div class="login-glass-dot" style="background:#febc2e"></div>
            <div class="login-glass-dot" style="background:#28c840"></div>
            <div class="login-glass-lock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Secure Authentication
            </div>
          </div>
          <div class="login-form-wrapper">
            <LoginForm />
          </div>
        </div>
        <!-- Mobile brand badge -->
        <div class="mobile-brand">
          <img :src="awashLogo" alt="Awash Insurance" class="mobile-logo" />
          <span class="mobile-brand-name">Awash Insurance</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Root Styles ────────────────────────────────────────────────────────── */
.login-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0f1419 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* ── Enhanced Animated Background ───────────────────────────────────────── */
.login-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Gradient Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: orbFloat 12s ease-in-out infinite alternate;
}

.orb-1 { 
  width: 600px; height: 600px; 
  background: radial-gradient(circle, #6366f1, #4338ca); 
  top: -200px; left: -180px; 
  animation-duration: 14s;
  opacity: 0.4;
}

.orb-2 { 
  width: 500px; height: 500px; 
  background: radial-gradient(circle, #0ea5e9, #0284c7); 
  bottom: -150px; right: -120px; 
  animation-duration: 10s; 
  animation-delay: -4s;
  opacity: 0.35;
}

.orb-3 { 
  width: 400px; height: 400px; 
  background: radial-gradient(circle, #8b5cf6, #7c3aed); 
  top: 50%; left: 40%; 
  animation-duration: 16s; 
  animation-delay: -7s;
  opacity: 0.25;
}

.orb-4 { 
  width: 350px; height: 350px; 
  background: radial-gradient(circle, #10b981, #059669); 
  bottom: 10%; left: 10%; 
  animation-duration: 13s; 
  animation-delay: -2s;
  opacity: 0.3;
}

.orb-5 { 
  width: 450px; height: 450px; 
  background: radial-gradient(circle, #f59e0b, #d97706); 
  top: 30%; right: 30%; 
  animation-duration: 18s; 
  animation-delay: -9s;
  opacity: 0.2;
}

.orb-6 { 
  width: 300px; height: 300px; 
  background: radial-gradient(circle, #ec4899, #db2777); 
  bottom: 40%; left: 60%; 
  animation-duration: 15s; 
  animation-delay: -5s;
  opacity: 0.25;
}

@keyframes orbFloat {
  0%   { 
    transform: translate(0, 0) scale(1) rotate(0deg); 
  }
  33%  { 
    transform: translate(50px, -60px) scale(1.1) rotate(120deg); 
  }
  66%  { 
    transform: translate(-40px, -20px) scale(0.95) rotate(240deg); 
  }
  100% { 
    transform: translate(-30px, 40px) scale(1.05) rotate(360deg); 
  }
}

/* Floating Particles */
.floating-particle {
  position: absolute;
  background: linear-gradient(135deg, #ffffff, #60a5fa);
  border-radius: 50%;
  filter: blur(1px);
  animation: floatParticle linear infinite;
}

@keyframes floatParticle {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(-100vh) translateX(100px) scale(0);
    opacity: 0;
  }
}

/* Grid Overlay with Animation */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 20s linear infinite;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}

@keyframes gridMove {
  0% {
    transform: perspective(500px) rotateX(30deg) translateY(0);
  }
  100% {
    transform: perspective(500px) rotateX(30deg) translateY(60px);
  }
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
.login-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 4rem;
  width: 100%;
  max-width: 1300px;
  padding: 4rem 2rem;
  align-items: center;
  box-sizing: border-box;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .login-layout { 
    grid-template-columns: 1fr; 
    padding: 2rem 1rem;
    max-width: 480px;
    align-items: center;
    justify-items: center;
  }
  .login-left { display: none; }
  .login-right { width: 100%; }
}

/* ── Left Panel Enhanced ────────────────────────────────────────────────── */
.login-left {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeSlideUp {
  from { 
    opacity: 0; 
    transform: translateY(40px);
    filter: blur(10px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
    filter: blur(0);
  }
}

/* Brand Row */
.brand-row { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
}

.brand-logo-wrap {
  width: 56px; 
  height: 56px; 
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  display: flex; 
  align-items: center; 
  justify-content: center;
  padding: 10px; 
  box-sizing: border-box;
  transition: all 0.3s ease;
  animation: logoPulse 3s ease-in-out infinite;
}

@keyframes logoPulse {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.2); 
  }
  50% { 
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.4); 
  }
}

.brand-logo-wrap:hover {
  transform: scale(1.05) rotate(5deg);
  border-color: rgba(99, 102, 241, 0.5);
}

.brand-logo-img { 
  width: 100%; 
  height: 100%; 
  object-fit: contain; 
  filter: brightness(0) invert(1); 
}

.brand-name { 
  font-size: 1.3rem; 
  font-weight: 800; 
  color: #fff; 
  letter-spacing: -0.02em;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.brand-sub { 
  font-size: 0.75rem; 
  color: rgba(255, 255, 255, 0.5); 
  margin-top: 2px; 
}

/* Headline */
.headline-h1 {
  font-size: 3rem; 
  font-weight: 900; 
  color: #fff;
  line-height: 1.2; 
  letter-spacing: -0.03em; 
  margin: 0 0 1rem;
  animation: textGlow 3s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% { 
    text-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
  }
  50% { 
    text-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
  }
}

.headline-gradient {
  background: linear-gradient(135deg, #60a5fa, #a78bfa, #34d399, #60a5fa);
  background-size: 200% 200%;
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 4s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.headline-p { 
  font-size: 0.95rem; 
  color: rgba(255, 255, 255, 0.6); 
  line-height: 1.7; 
  max-width: 480px; 
  margin: 0; 
}

/* Product Showcase with Animation */
.product-showcase {
  border: 1px solid;
  border-radius: 1.2rem;
  padding: 1.5rem;
  backdrop-filter: blur(30px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.product-showcase::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

.product-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-slide-leave-active {
  transition: all 0.3s ease-in;
}

.product-slide-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.product-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.product-showcase-top { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  margin-bottom: 1rem; 
}

.product-icon-wrap {
  width: 50px; 
  height: 50px; 
  border-radius: 14px;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  flex-shrink: 0;
  transition: all 0.3s ease;
  animation: iconGlow 2s ease-in-out infinite;
}

@keyframes iconGlow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.product-icon-svg { 
  width: 24px; 
  height: 24px; 
  color: #fff; 
  display: flex; 
}

.product-icon-svg :deep(svg) { 
  width: 24px; 
  height: 24px; 
  stroke: #fff; 
}

.product-name { 
  font-size: 1rem; 
  font-weight: 800; 
  letter-spacing: -0.01em; 
}

.product-tagline { 
  font-size: 0.75rem; 
  color: rgba(255, 255, 255, 0.5); 
  margin-top: 3px; 
}

.product-desc { 
  font-size: 0.85rem; 
  color: rgba(255, 255, 255, 0.65); 
  line-height: 1.7; 
  margin: 0 0 1.25rem; 
}

/* Enhanced Dot Indicators */
.product-dots { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
}

.product-dot { 
  width: 8px; 
  height: 8px; 
  border-radius: 50%; 
  background: rgba(255, 255, 255, 0.2); 
  border: none; 
  cursor: pointer; 
  padding: 0; 
  transition: all 0.3s ease;
  position: relative;
}

.product-dot:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.2);
}

.product-dot-active { 
  width: 24px; 
  border-radius: 4px; 
}

/* Product Pills Enhanced */
.product-pills { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 0.5rem; 
}

.product-pill {
  display: inline-flex; 
  align-items: center; 
  gap: 0.35rem;
  padding: 0.35rem 0.8rem; 
  border-radius: 9999px;
  font-size: 0.72rem; 
  font-weight: 600; 
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05); 
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.product-pill:hover { 
  background: rgba(255, 255, 255, 0.12); 
  color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.product-pill-active { 
  font-weight: 700;
  transform: translateY(-2px);
}

.pill-icon { 
  width: 14px; 
  height: 14px; 
  display: flex; 
  flex-shrink: 0; 
}

.pill-icon :deep(svg) { 
  width: 14px; 
  height: 14px; 
}

/* Trust Row Enhanced */
.trust-row { 
  display: flex; 
  align-items: center; 
  gap: 0.8rem; 
  flex-wrap: wrap; 
}

.trust-item { 
  display: flex; 
  align-items: center; 
  gap: 0.4rem; 
  font-size: 0.73rem; 
  color: rgba(255, 255, 255, 0.4); 
  font-weight: 500; 
  transition: all 0.3s ease;
}

.trust-item:hover {
  color: rgba(255, 255, 255, 0.7);
}

.trust-icon { 
  width: 14px; 
  height: 14px; 
  color: #34d399; 
  flex-shrink: 0;
  filter: drop-shadow(0 0 3px rgba(52, 211, 153, 0.3));
}

.trust-sep { 
  color: rgba(255, 255, 255, 0.2); 
  font-size: 0.6rem; 
}

/* ── Right Panel Glass Card Enhanced ────────────────────────────────────── */
.login-right {
  display: flex; 
  align-items: center; 
  justify-content: center;
  animation: fadeSlideUp 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.login-glass {
  width: 100%; 
  max-width: 440px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1.8rem;
  backdrop-filter: blur(30px) saturate(180%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 40px 100px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(99, 102, 241, 0.2),
    0 0 0 1px rgba(99, 102, 241, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.login-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.03));
  border-radius: 1.8rem;
  pointer-events: none;
}

.login-glass:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 40px 100px rgba(0, 0, 0, 0.6),
    0 0 100px rgba(99, 102, 241, 0.3),
    0 0 0 1px rgba(99, 102, 241, 0.2);
}

.login-glass-header {
  display: flex; 
  align-items: center; 
  gap: 7px;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
}

.login-glass-dot { 
  width: 12px; 
  height: 12px; 
  border-radius: 50%; 
  transition: all 0.3s ease;
}

.login-glass-dot:hover {
  transform: scale(1.2);
  filter: brightness(1.2);
}

.login-glass-title {
  margin-left: auto;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

.login-form-wrapper {
  padding: 0;
}

/* ── Stats Row ──────────────────────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
}

.stat-item { text-align: center; }

.stat-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.4);
  margin-top: 2px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Mobile brand badge ──────────────────────────────────────────────────── */
.mobile-brand {
  display: none;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.mobile-logo {
  width: 22px; height: 22px;
  object-fit: contain;
  filter: brightness(0) invert(0.5);
}

.mobile-brand-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
}

@media (max-width: 1024px) {
  .mobile-brand { display: flex; justify-content: center; }
}

/* ── Glass lock badge ────────────────────────────────────────────────────── */
.login-glass-lock {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.35);
  font-weight: 500;
}

/* ── Responsive Enhancements ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .login-glass { border-radius: 1.4rem; }
  .headline-h1 { font-size: 2.4rem; }
  .lf-body { padding: 1.5rem 1.25rem 1.25rem; }
}
</style>