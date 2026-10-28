<script setup>
import { computed } from 'vue';
import LoginForm from "./LoginForm.vue";
import standardLogo from '../assets/img/standard_logo_bilingual.svg';
import { useDarkModeStore } from '../stores/darkMode';

const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);
const year = new Date().getFullYear();

// Figures published on standardinsurancesc.com
const stats = [
  { value: '305.9M', unit: 'ETB', label: 'Subscribed capital' },
  { value: '1,749', unit: '', label: 'Founding shareholders' },
  { value: '19th', unit: '', label: 'Licensed insurer in Ethiopia' },
];

// Geometry of the Standard mark (400×400 canvas)
const MARK_NAVY = 'M125 68H400V172H248V332H0V213H125Z';
const MARK_ORANGE = 'M284 213H400V332H284Z';
</script>

<template>
  <div class="login-wrapper" :class="{ dark: isDark }">

    <!-- ── Atmosphere ── -->
    <div class="bg" aria-hidden="true">
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
      <div class="bg-glow bg-glow-3"></div>
      <span class="bokeh b1"></span>
      <span class="bokeh b2"></span>
      <span class="bokeh b3"></span>
      <span class="bokeh b4"></span>
      <span class="bokeh b5"></span>
      <svg class="bg-mark" viewBox="0 68 400 264" preserveAspectRatio="xMidYMid meet">
        <path :d="MARK_NAVY" />
        <path :d="MARK_ORANGE" class="bg-mark-accent" />
      </svg>
      <div class="bg-grid"></div>
    </div>

    <!-- ── Floating pill nav ── -->
    <header class="nav">
      <img :src="standardLogo" alt="Standard Insurance S.C. — ስታንዳርድ ኢንሹራንስ አ.ማ." class="nav-logo" />
      <div class="nav-actions">
        <a href="https://standardinsurancesc.com/" target="_blank" rel="noopener noreferrer" class="nav-link">
          Visit website
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>
        </a>
        <button
          class="nav-toggle"
          type="button"
          @click="darkStore.toggle()"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4.5"/><path stroke-linecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- ── Content ── -->
    <div class="content">
      <section class="hero">
        <span class="hero-eyebrow">
          <span class="pulse"></span>
          Digital Channel Portal
        </span>
        <h1 class="hero-title">
          Your trust,<br />
          our <span class="accent">standard.</span>
        </h1>
        <p class="hero-desc">
          Underwrite policies, settle claims and track performance across every insurance line — securely, in one place.
        </p>

        <dl class="stats">
          <div v-for="s in stats" :key="s.label" class="stat">
            <dt>{{ s.label }}</dt>
            <dd>
              <span v-if="s.unit" class="stat-unit">{{ s.unit }}</span>{{ s.value }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="panel" aria-label="Sign in">
        <div class="card">
          <LoginForm />
        </div>
        <p class="panel-foot">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Protected by Standard Secure Login
        </p>
      </section>
    </div>

    <footer class="foot">
      <span>© {{ year }} Standard Insurance S.C. · Licensed by the National Bank of Ethiopia</span>
      <span class="foot-am" lang="am">ስታንዳርድ ኢንሹራንስ አ.ማ.</span>
    </footer>
  </div>
</template>

<style scoped>
/* ── Theme tokens (shared with LoginForm.vue via --si-*) ── */
.login-wrapper {
  --si-navy: #0D4F80;
  --si-navy-deep: #06294A;
  --si-accent: #FE9312;
  --si-display: 'Rubik', 'Inter', system-ui, sans-serif;

  --si-bg: linear-gradient(140deg, #041C33 0%, #07335A 45%, #0D4F80 100%);
  --si-card: #FFFFFF;
  --si-card-border: rgba(255, 255, 255, 0.6);
  --si-card-shadow: 0 2px 6px rgba(2, 20, 40, 0.12), 0 40px 80px -24px rgba(2, 20, 40, 0.65);

  --si-surface: #FFFFFF;
  --si-text: #0B2440;
  --si-text-muted: #5A6B80;
  --si-placeholder: #98A4B5;
  --si-link: #0D4F80;
  --si-primary: #0D4F80;
  --si-ring: rgba(13, 79, 128, 0.14);
  --si-ring-strong: rgba(13, 79, 128, 0.35);
  --si-input-bg: #F3F6FA;
  --si-input-bg-focus: #FFFFFF;
  --si-input-border: #F3F6FA;
  --si-input-border-hover: #D5DEE9;
  --si-btn-bg: #0D4F80;
  --si-btn-bg-hover: #0A3F68;
  --si-btn-shadow: 0 10px 24px -8px rgba(13, 79, 128, 0.6);
  --si-btn-shadow-hover: 0 16px 32px -10px rgba(13, 79, 128, 0.75);
  --si-danger: #DC2626;
  --si-danger-strong: #991B1B;
  --si-danger-text: #7F1D1D;
  --si-danger-bg: #FEF2F2;
  --si-danger-border: #FECACA;
  --si-danger-ring: rgba(220, 38, 38, 0.12);
  --si-overlay: rgba(3, 22, 42, 0.9);

  position: relative;
  min-height: 100vh;
  display: flex; flex-direction: column;
  overflow: hidden;
  background: var(--si-bg);
  color: #fff;
  font-family: var(--si-display);
  isolation: isolate;
}

.login-wrapper.dark {
  --si-bg: linear-gradient(140deg, #020B16 0%, #04182C 50%, #072A4A 100%);
  --si-card: #0B1A2C;
  --si-card-border: rgba(255, 255, 255, 0.08);
  --si-card-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), 0 40px 80px -24px rgba(0, 0, 0, 0.85);

  --si-surface: #0B1A2C;
  --si-text: #EAF0F7;
  --si-text-muted: #8E9DB2;
  --si-placeholder: #5E6C82;
  --si-link: #FFAE4D;
  --si-primary: #4A92D6;
  --si-ring: rgba(74, 146, 214, 0.22);
  --si-ring-strong: rgba(74, 146, 214, 0.45);
  --si-input-bg: #08131F;
  --si-input-bg-focus: #0A1828;
  --si-input-border: #1B2B40;
  --si-input-border-hover: #2A3F5C;
  --si-btn-bg: #1565A6;
  --si-btn-bg-hover: #1A74BE;
  --si-btn-shadow: 0 10px 24px -8px rgba(21, 101, 166, 0.65);
  --si-btn-shadow-hover: 0 16px 32px -10px rgba(21, 101, 166, 0.8);
  --si-danger: #F87171;
  --si-danger-strong: #FECACA;
  --si-danger-text: #FCA5A5;
  --si-danger-bg: rgba(248, 113, 113, 0.08);
  --si-danger-border: rgba(248, 113, 113, 0.28);
  --si-danger-ring: rgba(248, 113, 113, 0.18);
  --si-overlay: rgba(2, 8, 16, 0.92);
}

/* ── Atmosphere ── */
.bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }

.bg-glow { position: absolute; border-radius: 50%; filter: blur(90px); }
.bg-glow-1 { width: 620px; height: 620px; right: -6%; top: 8%; background: radial-gradient(circle, rgba(254, 147, 18, 0.42), transparent 65%); animation: drift 18s ease-in-out infinite alternate; }
.bg-glow-2 { width: 520px; height: 520px; right: 24%; bottom: -22%; background: radial-gradient(circle, rgba(230, 110, 30, 0.3), transparent 65%); animation: drift 22s ease-in-out infinite alternate-reverse; }
.bg-glow-3 { width: 700px; height: 700px; left: -18%; top: -30%; background: radial-gradient(circle, rgba(40, 120, 190, 0.45), transparent 65%); }
.dark .bg-glow-1 { opacity: 0.7; }
.dark .bg-glow-2 { opacity: 0.6; }
.dark .bg-glow-3 { opacity: 0.5; }

/* Warm out-of-focus lights, echoing the website hero */
.bokeh {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(255, 196, 120, 0.9), rgba(254, 147, 18, 0.35) 55%, transparent 72%);
  filter: blur(1.5px);
  animation: float 12s ease-in-out infinite;
}
.b1 { width: 18px; height: 18px; right: 12%; top: 18%; animation-delay: 0s; }
.b2 { width: 34px; height: 34px; right: 30%; top: 70%; opacity: 0.6; filter: blur(4px); animation-delay: -3s; }
.b3 { width: 10px; height: 10px; right: 40%; top: 28%; animation-delay: -6s; }
.b4 { width: 56px; height: 56px; right: 4%; top: 62%; opacity: 0.35; filter: blur(8px); animation-delay: -8s; }
.b5 { width: 14px; height: 14px; left: 46%; top: 12%; opacity: 0.7; animation-delay: -4s; }

/* The mark as faint architectural line art */
.bg-mark {
  position: absolute; right: -6%; bottom: -10%;
  width: min(68vw, 980px); height: auto;
  fill: none; stroke: rgba(255, 255, 255, 0.07); stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}
.bg-mark path { vector-effect: non-scaling-stroke; }
.bg-mark-accent { stroke: rgba(254, 147, 18, 0.35); fill: rgba(254, 147, 18, 0.04); }

.bg-grid {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 70% 60% at 25% 45%, #000, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 25% 45%, #000, transparent 75%);
}

/* ── Nav ── */
.nav {
  position: relative; z-index: 2;
  width: calc(100% - 3rem); max-width: 1280px;
  margin: 1.5rem auto 0;
  padding: 0.65rem 0.7rem 0.65rem 1.6rem;
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  background: #fff;
  border-radius: 999px;
  box-shadow: 0 12px 40px -12px rgba(2, 20, 40, 0.5);
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.nav-logo { display: block; height: 46px; width: auto; }
.nav-actions { display: flex; align-items: center; gap: 0.5rem; }
.nav-link {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  font-size: 0.875rem; font-weight: 500; color: #0D4F80; text-decoration: none;
  transition: background 0.2s;
}
.nav-link:hover { background: #EEF3F8; }
.nav-link svg { width: 15px; height: 15px; }
.nav-toggle {
  width: 44px; height: 44px; border-radius: 50%;
  display: grid; place-items: center;
  border: none; cursor: pointer;
  background: #0D4F80; color: #fff;
  transition: transform 0.25s, background 0.2s;
}
.nav-toggle:hover { transform: rotate(-15deg); background: #0A3F68; }
.nav-toggle:focus-visible, .nav-link:focus-visible { outline: 2px solid var(--si-accent); outline-offset: 2px; }
.nav-toggle svg { width: 19px; height: 19px; }

/* ── Content ── */
.content {
  position: relative; z-index: 1;
  flex: 1;
  width: calc(100% - 3rem); max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 460px);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: center;
  padding: 3rem clamp(0rem, 2vw, 1.5rem);
  box-sizing: border-box;
}

.hero { animation: rise 0.8s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both; }

.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 0.6rem;
  padding: 0.45rem 1rem 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  font-size: 0.8rem; font-weight: 500; letter-spacing: 0.04em; color: rgba(255, 255, 255, 0.9);
}
.pulse { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--si-accent); }
.pulse::after {
  content: ''; position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid var(--si-accent); opacity: 0;
  animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.hero-title {
  margin: 1.5rem 0 0;
  font-size: clamp(2.6rem, 5vw, 4.6rem);
  font-weight: 700; line-height: 1.04; letter-spacing: -0.02em;
  color: #fff;
}
.hero-title .accent {
  background: linear-gradient(100deg, #FFB347 0%, #FE9312 50%, #F07A00 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.hero-desc {
  margin: 1.4rem 0 0;
  max-width: 470px;
  font-size: 1.075rem; line-height: 1.65; font-weight: 400;
  color: rgba(226, 236, 248, 0.82);
}

.stats {
  margin: 2.5rem 0 0;
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem;
  max-width: 560px;
}
.stat {
  padding: 1.1rem 1.15rem;
  border-radius: 20px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  display: flex; flex-direction: column-reverse; gap: 0.35rem;
}
.stat dt { font-size: 0.78rem; line-height: 1.35; color: rgba(226, 236, 248, 0.7); }
.stat dd { margin: 0; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.01em; color: #fff; line-height: 1.1; }
.stat-unit { font-size: 0.8rem; font-weight: 600; color: var(--si-accent); margin-right: 0.3rem; vertical-align: 0.35em; }

/* ── Sign-in panel ── */
.panel { display: flex; flex-direction: column; align-items: center; animation: rise 0.8s 0.16s cubic-bezier(0.16, 1, 0.3, 1) both; }
.card {
  position: relative;
  width: 100%;
  padding: 2.6rem 2.5rem 2.3rem;
  box-sizing: border-box;
  background: var(--si-card);
  border: 1px solid var(--si-card-border);
  border-radius: 28px;
  box-shadow: var(--si-card-shadow);
  color: var(--si-text);
}
/* Orange corner tab, from the logo's square */
.card::before {
  content: ''; position: absolute; top: 0; right: 2.5rem;
  width: 44px; height: 6px; border-radius: 0 0 6px 6px;
  background: var(--si-accent);
}

.panel-foot {
  display: inline-flex; align-items: center; gap: 0.45rem;
  margin: 1.25rem 0 0;
  font-size: 0.85rem; font-weight: 500; color: rgba(226, 236, 248, 0.8);
}
.panel-foot svg { width: 16px; height: 16px; color: var(--si-accent); }

/* ── Footer ── */
.foot {
  position: relative; z-index: 1;
  width: calc(100% - 3rem); max-width: 1280px;
  margin: 0 auto;
  padding: 1.25rem clamp(0rem, 2vw, 1.5rem) 1.5rem;
  box-sizing: border-box;
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem 1.5rem;
  font-size: 0.8rem; color: rgba(226, 236, 248, 0.55);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.foot-am { font-weight: 500; color: rgba(255, 196, 120, 0.75); }

@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes drift { from { transform: translate(0, 0) scale(1); } to { transform: translate(-40px, 30px) scale(1.08); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
@keyframes ping { 0% { transform: scale(0.6); opacity: 0.8; } 80%, 100% { transform: scale(1.8); opacity: 0; } }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .stats { grid-template-columns: 1fr 1fr; }
  .stat:last-child { display: none; }
}

@media (max-width: 960px) {
  .content { grid-template-columns: 1fr; gap: 2rem; padding-top: 2.25rem; max-width: 560px; }
  .hero { text-align: left; }
  .hero-title { font-size: clamp(2.2rem, 8vw, 3rem); }
  .stats { display: none; }
  .bg-mark { width: 140vw; right: -40%; bottom: -5%; }
}

@media (max-width: 560px) {
  .nav { width: calc(100% - 2rem); margin-top: 1rem; padding: 0.5rem 0.5rem 0.5rem 1.1rem; }
  .nav-logo { height: auto; width: min(220px, 100%); }
  .nav-link { display: none; }
  .nav-toggle { width: 40px; height: 40px; }
  .content { width: calc(100% - 2rem); padding: 1.75rem 0 1.5rem; }
  .hero-desc { display: none; }
  .card { padding: 2rem 1.35rem 1.75rem; border-radius: 24px; }
  .card::before { right: 1.5rem; }
  .foot { width: calc(100% - 2rem); padding: 1rem 0 1.25rem; flex-direction: column; align-items: center; text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .nav, .hero, .panel, .bg-glow, .bokeh, .pulse::after { animation: none !important; }
}
</style>
