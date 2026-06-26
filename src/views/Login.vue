<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import LoginForm from "./LoginForm.vue";
import eicLogo from '../assets/img/logo.png';
import { useDarkModeStore } from '../stores/darkMode';

const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

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
  for (let i = 0; i < 18; i++) {
    list.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 22 + 12,
      delay: Math.random() * 12,
      opacity: Math.random() * 0.18 + 0.05
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
    bg: 'rgba(16,185,129,0.10)',
    bgLight: 'rgba(16,185,129,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`,
  },
  {
    id: 'motor',
    name: 'Motor Insurance',
    tagline: 'Drive with Confidence',
    desc: 'Third-party liability, comprehensive, and fleet coverage. Instant claims processing with 24/7 roadside assistance.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.10)',
    bgLight: 'rgba(99,102,241,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>`,
  },
  {
    id: 'fire',
    name: 'Fire Insurance',
    tagline: 'Protect What Matters Most',
    desc: 'Covers buildings, contents, and assets against fire, lightning, explosion, and allied perils with rapid assessment.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    bgLight: 'rgba(245,158,11,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>`,
  },
  {
    id: 'marine',
    name: 'Marine Insurance',
    tagline: 'Secure Your Cargo & Fleet',
    desc: 'Comprehensive marine cargo, hull, and freight liability. Protect goods in transit across sea, air, and land routes.',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.10)',
    bgLight: 'rgba(14,165,233,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 17l9-13 9 13M3 17h18M12 4v13"/></svg>`,
  },
  {
    id: 'life',
    name: 'Life Insurance',
    tagline: "Securing Your Family's Future",
    desc: 'Term life, whole life, and endowment plans. Guaranteed payouts to protect loved ones and build long-term savings.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.10)',
    bgLight: 'rgba(139,92,246,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
  },
  {
    id: 'engineering',
    name: 'Engineering Insurance',
    tagline: 'Coverage for Complex Projects',
    desc: 'Erection all risk, contractors all risk, and machinery breakdown. Tailored for construction and industrial operations.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    bgLight: 'rgba(249,115,22,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
  {
    id: 'liability',
    name: 'Liability Insurance',
    tagline: 'Shield Against Legal Risk',
    desc: "Public liability, product liability, professional indemnity, and employer's liability for businesses of all sizes.",
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.10)',
    bgLight: 'rgba(236,72,153,0.07)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>`,
  },
  {
    id: 'burglary',
    name: 'Burglary Insurance',
    tagline: 'Guard Against Theft & Loss',
    desc: 'Covers loss of property due to theft, burglary, and housebreaking. Available for homes, businesses, and cash in transit.',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.10)',
    bgLight: 'rgba(20,184,166,0.07)',
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
  <div class="login-root" :class="{ dark: isDark }">

    <!-- ── Animated Background ── -->
    <div class="login-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      <div class="grid-overlay"></div>
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

    <!-- Dark mode toggle -->
    <button class="dark-toggle" @click="darkStore.toggle()" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/><path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    </button>

    <!-- Main Layout -->
    <div class="login-layout">

      <!-- LEFT: Brand Section -->
      <div class="login-left">

        <!-- ── EIC Hero Block ── -->
        <div class="eic-hero">
          <div class="eic-logo-ring">
            <img :src="eicLogo" alt="EIC Logo" class="eic-logo-img" />
          </div>
          <div class="eic-title-block">
            <div class="eic-label">Trusted Since 1976</div>
            <h1 class="eic-name">Ethiopian Insurance<br/>Corporation</h1>
            <div class="eic-name-amharic">የኢትዮጵያ መድን ድርጅት</div>
            <div class="eic-tagline">
              <span class="eic-tagline-dot"></span>
              Insure Connect — Unified Insurance Platform
            </div>
          </div>
        </div>

        <!-- Headline -->
        <div class="headline-block">
          <p class="headline-desc">
            One platform. Eight product lines. Real-time policies, instant claims,
            and enterprise analytics — all secured and unified under EIC.
          </p>
        </div>

        <!-- Product Showcase -->
        <Transition name="product-slide" mode="out-in">
          <div
            :key="activeProduct"
            class="product-showcase"
            :style="{
              background: isDark ? products[activeProduct].bg : products[activeProduct].bgLight,
              borderColor: products[activeProduct].color + '35'
            }"
          >
            <div class="product-showcase-top">
              <div
                class="product-icon-wrap"
                :style="{
                  background: `linear-gradient(135deg, ${products[activeProduct].color}, ${products[activeProduct].color}cc)`,
                  boxShadow: `0 0 24px ${products[activeProduct].color}35`
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
            <div class="product-dots">
              <button
                v-for="(p, i) in products"
                :key="p.id"
                class="product-dot"
                :class="{ 'product-dot-active': i === activeProduct }"
                :style="i === activeProduct ? { background: products[activeProduct].color, boxShadow: `0 0 8px ${products[activeProduct].color}` } : {}"
                @click="activeProduct = i; stopRotate()"
              />
            </div>
          </div>
        </Transition>

        <!-- Stats Row -->
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
              background: p.color + '18',
              borderColor: p.color + '70',
              color: p.color,
              boxShadow: `0 0 14px ${p.color}25`
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

      <!-- RIGHT: Login Card -->
      <div class="login-right">
        <div class="login-glass">
          <div class="login-glass-header">
            <div class="login-glass-dot" style="background:#ff5f57"></div>
            <div class="login-glass-dot" style="background:#febc2e"></div>
            <div class="login-glass-dot" style="background:#28c840"></div>
            <div class="login-glass-lock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
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
          <img :src="eicLogo" alt="EIC" class="mobile-logo" />
          <span class="mobile-brand-name">Ethiopian Insurance Corporation</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── CSS Variables for light/dark theming ── */
.login-root {
  --bg-main: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f0ff 100%);
  --bg-card: rgba(255,255,255,0.85);
  --bg-card-border: rgba(99,102,241,0.15);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --orb-opacity: 0.12;
  --grid-color: rgba(99,102,241,0.06);
  --particle-bg: linear-gradient(135deg, #6366f1, #818cf8);
  --showcase-border: rgba(0,0,0,0.08);
  --pill-bg: rgba(0,0,0,0.04);
  --pill-border: rgba(0,0,0,0.08);
  --pill-color: #475569;
  --pill-hover-bg: rgba(99,102,241,0.08);
  --trust-color: #6366f1;
  --trust-sep-color: #cbd5e1;
  --stats-bg: rgba(99,102,241,0.06);
  --stats-border: rgba(99,102,241,0.12);
  --glass-bg: rgba(255,255,255,0.88);
  --glass-border: rgba(99,102,241,0.18);
  --glass-shadow: 0 20px 60px rgba(99,102,241,0.12), 0 4px 20px rgba(0,0,0,0.08);
  --glass-header-bg: rgba(248,250,252,0.9);
  --glass-header-border: rgba(226,232,240,0.8);
  --glass-lock-color: #64748b;
  --eic-name-color: #1e293b;
  --eic-label-color: #6366f1;
  --eic-tagline-color: #475569;
  --logo-ring-bg: linear-gradient(135deg, #6366f1, #818cf8);
  --logo-ring-border: rgba(99,102,241,0.3);
  --dot-toggle-bg: rgba(255,255,255,0.85);
  --dot-toggle-border: rgba(99,102,241,0.2);
  --dot-toggle-color: #475569;
  /* Input theming */
  --input-bg: rgba(241,245,249,0.8);
  --input-border: rgba(99,102,241,0.2);
  --input-border-hover: rgba(99,102,241,0.35);
  --input-bg-hover: rgba(241,245,249,1);
  --input-bg-focus: rgba(99,102,241,0.06);
  --input-placeholder: #94a3b8;
}

.login-root.dark {
  --bg-main: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0f1419 100%);
  --bg-card: rgba(255,255,255,0.06);
  --bg-card-border: rgba(255,255,255,0.12);
  --text-primary: #f1f5f9;
  --text-secondary: rgba(255,255,255,0.65);
  --text-muted: rgba(255,255,255,0.4);
  --orb-opacity: 0.3;
  --grid-color: rgba(99,102,241,0.05);
  --particle-bg: linear-gradient(135deg, #ffffff, #60a5fa);
  --showcase-border: rgba(255,255,255,0.08);
  --pill-bg: rgba(255,255,255,0.05);
  --pill-border: rgba(255,255,255,0.1);
  --pill-color: rgba(255,255,255,0.5);
  --pill-hover-bg: rgba(255,255,255,0.1);
  --trust-color: #34d399;
  --trust-sep-color: rgba(255,255,255,0.2);
  --stats-bg: rgba(255,255,255,0.04);
  --stats-border: rgba(255,255,255,0.08);
  --glass-bg: rgba(255,255,255,0.07);
  --glass-border: rgba(255,255,255,0.15);
  --glass-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.2);
  --glass-header-bg: rgba(255,255,255,0.04);
  --glass-header-border: rgba(255,255,255,0.08);
  --glass-lock-color: rgba(255,255,255,0.35);
  --eic-name-color: #ffffff;
  --eic-label-color: #818cf8;
  --eic-tagline-color: rgba(255,255,255,0.5);
  --logo-ring-bg: rgba(255,255,255,0.1);
  --logo-ring-border: rgba(255,255,255,0.25);
  --dot-toggle-bg: rgba(255,255,255,0.08);
  --dot-toggle-border: rgba(255,255,255,0.15);
  --dot-toggle-color: rgba(255,255,255,0.7);
  /* Input theming */
  --input-bg: rgba(255,255,255,0.06);
  --input-border: rgba(255,255,255,0.12);
  --input-border-hover: rgba(255,255,255,0.22);
  --input-bg-hover: rgba(255,255,255,0.09);
  --input-bg-focus: rgba(99,102,241,0.08);
  --input-placeholder: rgba(255,255,255,0.28);
}

/* ── Root ── */
.login-root {
  min-height: 100vh;
  background: var(--bg-main);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: background 0.4s ease;
}

/* Dark Mode Toggle */
.dark-toggle {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 100;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1.5px solid var(--dot-toggle-border);
  background: var(--dot-toggle-bg);
  color: var(--dot-toggle-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.dark-toggle:hover { transform: scale(1.1); box-shadow: 0 4px 20px rgba(99,102,241,0.3); }
.dark-toggle svg { width: 18px; height: 18px; }

/* ── Animated Background ── */
.login-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: var(--orb-opacity);
  animation: orbFloat 12s ease-in-out infinite alternate;
}
.orb-1 { width: 550px; height: 550px; background: radial-gradient(circle, #6366f1, #4338ca); top: -180px; left: -150px; animation-duration: 14s; }
.orb-2 { width: 450px; height: 450px; background: radial-gradient(circle, #0ea5e9, #0284c7); bottom: -120px; right: -100px; animation-duration: 10s; animation-delay: -4s; }
.orb-3 { width: 380px; height: 380px; background: radial-gradient(circle, #8b5cf6, #7c3aed); top: 50%; left: 40%; animation-duration: 16s; animation-delay: -7s; }
.orb-4 { width: 300px; height: 300px; background: radial-gradient(circle, #10b981, #059669); bottom: 10%; left: 10%; animation-duration: 13s; animation-delay: -2s; }

@keyframes orbFloat {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(40px, -50px) scale(1.08); }
  100% { transform: translate(-25px, 35px) scale(1.03); }
}

.floating-particle {
  position: absolute;
  background: var(--particle-bg);
  border-radius: 50%;
  filter: blur(1px);
  animation: floatParticle linear infinite;
}
@keyframes floatParticle {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 0.5; }
  100% { transform: translateY(-100vh) translateX(80px) scale(0); opacity: 0; }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 20s linear infinite;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}
@keyframes gridMove {
  0%   { transform: perspective(500px) rotateX(28deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(28deg) translateY(60px); }
}

/* ── Layout ── */
.login-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 4rem;
  width: 100%;
  max-width: 1320px;
  padding: 4rem 2rem;
  align-items: center;
  box-sizing: border-box;
  margin: 0 auto;
}
@media (max-width: 1024px) {
  .login-layout { grid-template-columns: 1fr; padding: 2rem 1rem; max-width: 480px; align-items: center; justify-items: center; }
  .login-left { display: none; }
  .login-right { width: 100%; }
}

/* ── Left Panel ── */
.login-left {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(40px); filter: blur(8px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* ── EIC Hero ── */
.eic-hero {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem;
  background: var(--bg-card);
  border: 1.5px solid var(--glass-border);
  border-radius: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(99,102,241,0.08);
  transition: all 0.4s ease;
}

.eic-logo-ring {
  width: 90px;
  height: 90px;
  border-radius: 20px;
  background: var(--logo-ring-bg);
  border: 2px solid var(--logo-ring-border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  flex-shrink: 0;
  animation: logoPulse 3s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(99,102,241,0.25);
}
@keyframes logoPulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,0.2); }
  50%       { box-shadow: 0 8px 48px rgba(99,102,241,0.4); }
}

.eic-logo-img { width: 100%; height: 100%; object-fit: contain; }

.eic-title-block { display: flex; flex-direction: column; gap: 0.3rem; }

.eic-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--eic-label-color);
}

.eic-name {
  font-size: 1.7rem;
  font-weight: 900;
  color: var(--eic-name-color);
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin: 0;
  transition: color 0.4s ease;
}

.eic-tagline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--eic-tagline-color);
  font-weight: 500;
  margin-top: 0.2rem;
  transition: color 0.4s ease;
}

.eic-name-amharic {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--eic-label-color);
  letter-spacing: 0.02em;
  margin-top: 0.15rem;
  transition: color 0.4s ease;
}
.eic-tagline-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  flex-shrink: 0;
  animation: liveP 2s ease-in-out infinite;
}
@keyframes liveP {
  0%,100% { box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
  50%      { box-shadow: 0 0 0 5px rgba(16,185,129,0.06); }
}

/* ── Headline ── */
.headline-block {}
.headline-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 480px;
  margin: 0;
  transition: color 0.4s ease;
}

/* ── Product Showcase ── */
.product-showcase {
  border: 1.5px solid;
  border-radius: 1.2rem;
  padding: 1.4rem;
  backdrop-filter: blur(30px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.product-showcase::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(255,255,255,0.03));
  pointer-events: none;
}

.product-slide-enter-active { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.product-slide-leave-active { transition: all 0.3s ease-in; }
.product-slide-enter-from  { opacity: 0; transform: translateY(18px) scale(0.96); }
.product-slide-leave-to    { opacity: 0; transform: translateY(-18px) scale(0.96); }

.product-showcase-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.875rem; }

.product-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  animation: iconGlow 2.2s ease-in-out infinite;
}
@keyframes iconGlow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.product-icon-svg { width: 24px; height: 24px; color: #fff; display: flex; }
.product-icon-svg :deep(svg) { width: 24px; height: 24px; stroke: #fff; }

.product-name { font-size: 1rem; font-weight: 800; letter-spacing: -0.01em; }
.product-tagline { font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; transition: color 0.4s; }
.product-desc { font-size: 0.84rem; color: var(--text-secondary); line-height: 1.7; margin: 0 0 1.1rem; transition: color 0.4s; }

.product-dots { display: flex; gap: 7px; align-items: center; }
.product-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(120,120,120,0.2);
  border: none; cursor: pointer; padding: 0;
  transition: all 0.3s ease;
}
.product-dot:hover { background: rgba(120,120,120,0.4); transform: scale(1.2); }
.product-dot-active { width: 22px; border-radius: 4px; }

/* ── Stats ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: var(--stats-bg);
  border: 1px solid var(--stats-border);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  transition: all 0.4s ease;
}
.stat-item { text-align: center; }
.stat-value {
  font-size: 1.1rem; font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}
.stat-label { font-size: 0.65rem; color: var(--text-muted); margin-top: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; transition: color 0.4s; }

/* ── Pills ── */
.product-pills { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.product-pill {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.32rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.72rem; font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--pill-border);
  background: var(--pill-bg);
  color: var(--pill-color);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.product-pill:hover { background: var(--pill-hover-bg); color: var(--text-primary); transform: translateY(-2px); }
.product-pill-active { font-weight: 700; transform: translateY(-2px); }
.pill-icon { width: 13px; height: 13px; display: flex; flex-shrink: 0; }
.pill-icon :deep(svg) { width: 13px; height: 13px; }

/* ── Trust ── */
.trust-row { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
.trust-item {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.73rem; color: var(--text-muted); font-weight: 500;
  transition: all 0.3s ease, color 0.4s ease;
}
.trust-item:hover { color: var(--text-primary); }
.trust-icon { width: 14px; height: 14px; color: var(--trust-color); flex-shrink: 0; }
.trust-sep { color: var(--trust-sep-color); font-size: 0.6rem; }

/* ── Right Panel / Glass Card ── */
.login-right {
  display: flex; align-items: center; justify-content: center;
  animation: fadeSlideUp 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.login-glass {
  width: 100%;
  max-width: 440px;
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  border-radius: 1.8rem;
  backdrop-filter: blur(30px) saturate(180%);
  box-shadow: var(--glass-shadow);
  overflow: hidden;
  transition: all 0.4s ease;
  position: relative;
}
.login-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  border-radius: 1.8rem;
  pointer-events: none;
}
.login-glass:hover {
  border-color: rgba(99,102,241,0.4);
  box-shadow: var(--glass-shadow), 0 0 60px rgba(99,102,241,0.15);
}

.login-glass-header {
  display: flex; align-items: center; gap: 7px;
  padding: 0.875rem 1.2rem;
  border-bottom: 1px solid var(--glass-header-border);
  background: var(--glass-header-bg);
  backdrop-filter: blur(20px);
  transition: all 0.4s ease;
}
.login-glass-dot { width: 12px; height: 12px; border-radius: 50%; transition: all 0.3s; }
.login-glass-dot:hover { transform: scale(1.2); filter: brightness(1.2); }
.login-glass-lock {
  margin-left: auto;
  display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.7rem; color: var(--glass-lock-color);
  font-weight: 500;
  transition: color 0.4s ease;
}

.login-form-wrapper { padding: 0; }

/* ── Mobile brand ── */
.mobile-brand { display: none; align-items: center; gap: 0.5rem; margin-top: 1.25rem; }
.mobile-logo { width: 22px; height: 22px; object-fit: contain; }
.mobile-brand-name { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); transition: color 0.4s; }
@media (max-width: 1024px) { .mobile-brand { display: flex; justify-content: center; } }

@media (max-width: 768px) {
  .login-glass { border-radius: 1.4rem; }
}
</style>