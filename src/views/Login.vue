<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import LoginForm from "./LoginForm.vue";
import awashLogo from '../assets/img/awashlogo.svg';

const activeProduct = ref(0);
let rotateTimer = null;

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
  rotateTimer = setInterval(() => {
    activeProduct.value = (activeProduct.value + 1) % products.length;
  }, 3200);
});

onBeforeUnmount(() => clearInterval(rotateTimer));
</script>

<template>
  <div class="login-root">

    <!-- ── Animated background ── -->
    <div class="login-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- ── Main layout ── -->
    <div class="login-layout">

      <!-- LEFT: Brand + Products -->
      <div class="login-left">

        <!-- Logo -->
        <div class="brand-row">
          <div class="brand-logo-wrap">
            <img :src="awashLogo" alt="Awash Insurance" class="brand-logo-img" />
          </div>
          <div>
            <div class="brand-name">Awash Insurance</div>
            <div class="brand-sub">Unified Insurance Platform</div>
          </div>
        </div>

        <!-- Headline -->
        <div class="headline-block">
          <h1 class="headline-h1">
            Complete Insurance<br/>
            <span class="headline-gradient">Management Suite</span>
          </h1>
          <p class="headline-p">
            One platform. Eight product lines. Real-time policies, instant claims, and enterprise analytics — all secured and unified.
          </p>
        </div>

        <!-- Active product showcase -->
        <div class="product-showcase" :style="{ background: products[activeProduct].bg, borderColor: products[activeProduct].color + '40' }">
          <div class="product-showcase-top">
            <div class="product-icon-wrap" :style="{ background: `linear-gradient(135deg, ${products[activeProduct].color}cc, ${products[activeProduct].color})` }">
              <span v-html="products[activeProduct].icon" class="product-icon-svg"></span>
            </div>
            <div>
              <div class="product-name" :style="{ color: products[activeProduct].color }">{{ products[activeProduct].name }}</div>
              <div class="product-tagline">{{ products[activeProduct].tagline }}</div>
            </div>
          </div>
          <p class="product-desc">{{ products[activeProduct].desc }}</p>
          <!-- Dot indicators -->
          <div class="product-dots">
            <button
              v-for="(p, i) in products"
              :key="p.id"
              class="product-dot"
              :class="{ 'product-dot-active': i === activeProduct }"
              :style="i === activeProduct ? { background: products[activeProduct].color } : {}"
              @click="activeProduct = i; clearInterval(rotateTimer)"
            />
          </div>
        </div>

        <!-- Product grid pills -->
        <div class="product-pills">
          <button
            v-for="(p, i) in products"
            :key="p.id"
            class="product-pill"
            :class="{ 'product-pill-active': i === activeProduct }"
            :style="i === activeProduct ? { background: p.color + '22', borderColor: p.color + '80', color: p.color } : {}"
            @click="activeProduct = i"
          >
            <span v-html="p.icon" class="pill-icon"></span>
            {{ p.name }}
          </button>
        </div>

        <!-- Trust row -->
        <div class="trust-row">
          <div class="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            ISO 27001 Certified
          </div>
          <span class="trust-sep">•</span>
          <div class="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            256-bit Encryption
          </div>
          <span class="trust-sep">•</span>
          <div class="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="trust-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            99.9% Uptime SLA
          </div>
        </div>

      </div>

      <!-- RIGHT: Login glass card -->
      <div class="login-right">
        <div class="login-glass">
          <div class="login-glass-header">
            <div class="login-glass-dot" style="background:#ef4444"></div>
            <div class="login-glass-dot" style="background:#f59e0b"></div>
            <div class="login-glass-dot" style="background:#10b981"></div>
          </div>
          <LoginForm />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────────────── */
.login-root {
  min-height: 100vh;
  background: #050b18;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Animated background ──────────────────────────────────────────────────── */
.login-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  animation: orbFloat 12s ease-in-out infinite alternate;
}
.orb-1 { width: 560px; height: 560px; background: radial-gradient(circle, #6366f1, #4338ca); top: -180px; left: -160px; animation-duration: 14s; }
.orb-2 { width: 480px; height: 480px; background: radial-gradient(circle, #0ea5e9, #0284c7); bottom: -120px; right: -100px; animation-duration: 10s; animation-delay: -4s; }
.orb-3 { width: 360px; height: 360px; background: radial-gradient(circle, #8b5cf6, #7c3aed); top: 40%; left: 38%; animation-duration: 16s; animation-delay: -7s; }
.orb-4 { width: 300px; height: 300px; background: radial-gradient(circle, #10b981, #059669); bottom: 10%; left: 10%; animation-duration: 13s; animation-delay: -2s; }

@keyframes orbFloat {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(40px, -50px) scale(1.08); }
  100% { transform: translate(-30px, 30px) scale(0.94); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* ── Layout ───────────────────────────────────────────────────────────────── */
.login-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 3rem;
  width: 100%;
  max-width: 1200px;
  padding: 2.5rem 2rem;
  align-items: center;
  min-height: 100vh;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .login-layout { grid-template-columns: 1fr; padding: 1.5rem 1rem; }
  .login-left { display: none; }
}

/* ── Left Panel ───────────────────────────────────────────────────────────── */
.login-left {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  animation: fadeSlideUp 0.7s ease-out both;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Brand row */
.brand-row { display: flex; align-items: center; gap: 0.9rem; }
.brand-logo-wrap {
  width: 50px; height: 50px; border-radius: 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 8px; box-sizing: border-box;
}
.brand-logo-img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1); }
.brand-name { font-size: 1.2rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.brand-sub  { font-size: 0.72rem; color: rgba(255,255,255,0.45); margin-top: 1px; }

/* Headline */
.headline-block {}
.headline-h1 {
  font-size: 2.6rem; font-weight: 900; color: #fff;
  line-height: 1.15; letter-spacing: -0.03em; margin: 0 0 0.75rem;
}
.headline-gradient {
  background: linear-gradient(90deg, #60a5fa, #a78bfa, #34d399);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.headline-p { font-size: 0.92rem; color: rgba(255,255,255,0.55); line-height: 1.65; max-width: 460px; margin: 0; }

/* Product showcase */
.product-showcase {
  border: 1px solid;
  border-radius: 1.1rem;
  padding: 1.25rem 1.4rem;
  backdrop-filter: blur(16px);
  transition: all 0.5s ease;
  animation: fadeSlideUp 0.5s ease-out both;
}
.product-showcase-top { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 0.75rem; }
.product-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.product-icon-svg { width: 22px; height: 22px; color: #fff; display: flex; }
.product-icon-svg :deep(svg) { width: 22px; height: 22px; stroke: #fff; }
.product-name   { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.01em; }
.product-tagline { font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-top: 2px; }
.product-desc   { font-size: 0.8rem; color: rgba(255,255,255,0.6); line-height: 1.6; margin: 0 0 1rem; }
.product-dots   { display: flex; gap: 6px; align-items: center; }
.product-dot    { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; cursor: pointer; padding: 0; transition: all 0.25s; }
.product-dot-active { width: 22px; border-radius: 4px; }

/* Product pills */
.product-pills { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.product-pill {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.3rem 0.7rem; border-radius: 9999px;
  font-size: 0.7rem; font-weight: 600; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
  transition: all 0.2s;
}
.product-pill:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); }
.product-pill-active { font-weight: 700; }
.pill-icon { width: 13px; height: 13px; display: flex; flex-shrink: 0; }
.pill-icon :deep(svg) { width: 13px; height: 13px; }

/* Trust row */
.trust-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.trust-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: rgba(255,255,255,0.38); font-weight: 500; }
.trust-icon { width: 13px; height: 13px; color: #34d399; flex-shrink: 0; }
.trust-sep  { color: rgba(255,255,255,0.18); font-size: 0.6rem; }

/* ── Right Panel (glass card) ─────────────────────────────────────────────── */
.login-right {
  display: flex; align-items: center; justify-content: center;
  animation: fadeSlideUp 0.7s 0.15s ease-out both;
}

.login-glass {
  width: 100%; max-width: 420px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 1.5rem;
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05) inset,
    0 32px 80px rgba(0,0,0,0.5),
    0 0 60px rgba(99,102,241,0.15);
  padding: 0 0 1.5rem;
  overflow: hidden;
}

.login-glass-header {
  display: flex; align-items: center; gap: 6px;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
}
.login-glass-dot { width: 11px; height: 11px; border-radius: 50%; }
</style>