<script setup>
import { computed } from 'vue';
import LoginForm from "./LoginForm.vue";
import standardLogo from '../assets/img/standard_logo_bilingual.svg';
import { useDarkModeStore } from '../stores/darkMode';

const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);
const year = new Date().getFullYear();
const environment = import.meta.env.PROD ? 'Production' : 'Development';

// What the console administers — one entry per back-office area
const capabilities = [
  {
    title: 'Underwriting & policies',
    desc: 'Quotations, proposals, issuance and endorsements',
    icon: 'M9 12h6M9 16h6M9 8h2M6 3h9l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z',
  },
  {
    title: 'Claims administration',
    desc: 'Intake, assessment, approval and settlement',
    icon: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  },
  {
    title: 'Users & access control',
    desc: 'Staff accounts, roles and privileges',
    icon: 'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 19v-1a4 4 0 00-3-3.87M16 3.13a3.5 3.5 0 010 6.75',
  },
  {
    title: 'Reports & audit',
    desc: 'Performance, utilization and audit trails',
    icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  },
];

// Geometry of the Standard mark (400×400 canvas)
const MARK_NAVY = 'M125 68H400V172H248V332H0V213H125Z';
const MARK_ORANGE = 'M284 213H400V332H284Z';
</script>

<template>
  <div class="login-wrapper" :class="{ dark: isDark }">

    <!-- ── Brand / console side ── -->
    <aside class="brand">
      <div class="brand-bg" aria-hidden="true">
        <div class="brand-grid"></div>
        <svg class="brand-mark" viewBox="0 68 400 264" preserveAspectRatio="xMidYMid meet">
          <path :d="MARK_NAVY" />
          <path :d="MARK_ORANGE" class="brand-mark-accent" />
        </svg>
      </div>

      <div class="logo-plate">
        <img :src="standardLogo" alt="Standard Insurance S.C. — ስታንዳርድ ኢንሹራንስ አ.ማ." class="logo" />
      </div>

      <div class="brand-body">
        <span class="eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/>
          </svg>
          Administration Console
        </span>
        <h1 class="brand-title">Admin <span class="accent">Portal</span></h1>
        <p class="brand-desc">
          Back-office workspace for Standard Insurance staff — manage policies, claims, users and reporting across Life and Non-Life lines.
        </p>

        <ul class="caps">
          <li v-for="c in capabilities" :key="c.title" class="cap">
            <span class="cap-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="c.icon"/></svg>
            </span>
            <span class="cap-text">
              <strong>{{ c.title }}</strong>
              <span>{{ c.desc }}</span>
            </span>
          </li>
        </ul>
      </div>

      <div class="brand-foot">
        <span class="env">
          <span class="env-dot" :class="{ 'env-dot--dev': environment !== 'Production' }"></span>
          {{ environment }} environment
        </span>
        <span>Licensed by the National Bank of Ethiopia</span>
      </div>
    </aside>

    <!-- ── Sign-in side ── -->
    <main class="panel">
      <div class="panel-top">
        <span class="secure-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>
          </svg>
          Secure staff access
        </span>
        <button
          class="theme-toggle"
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

      <section class="panel-body" aria-label="Sign in">
        <div class="form-wrap">
          <LoginForm />

          <div class="notice" role="note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01"/>
            </svg>
            <p>
              <strong>Authorized personnel only.</strong>
              Access is restricted to Standard Insurance staff. Sign-in attempts and activity on this system are logged and monitored.
            </p>
          </div>
        </div>
      </section>

      <footer class="panel-foot">
        <span>© {{ year }} Standard Insurance S.C.</span>
        <span class="foot-am" lang="am">ስታንዳርድ ኢንሹራንስ አ.ማ.</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* ── Theme tokens (shared with LoginForm.vue via --si-*) ── */
.login-wrapper {
  --si-navy: #0D4F80;
  --si-navy-deep: #06294A;
  --si-accent: #FE9312;
  --si-display: 'Rubik', 'Inter', system-ui, sans-serif;

  --si-page: #F4F7FB;
  --si-panel-border: #E3E9F1;
  --si-surface: #FFFFFF;
  --si-text: #0B2440;
  --si-text-muted: #5A6B80;
  --si-placeholder: #98A4B5;
  --si-link: #0D4F80;
  --si-primary: #0D4F80;
  --si-ring: rgba(13, 79, 128, 0.14);
  --si-ring-strong: rgba(13, 79, 128, 0.35);
  --si-input-bg: #FFFFFF;
  --si-input-bg-focus: #FFFFFF;
  --si-input-border: #D3DCE7;
  --si-input-border-hover: #A9B8CB;
  --si-btn-bg: #0D4F80;
  --si-btn-bg-hover: #0A3F68;
  --si-btn-shadow: 0 6px 16px -8px rgba(13, 79, 128, 0.6);
  --si-btn-shadow-hover: 0 10px 22px -10px rgba(13, 79, 128, 0.75);
  --si-danger: #DC2626;
  --si-danger-strong: #991B1B;
  --si-danger-text: #7F1D1D;
  --si-danger-bg: #FEF2F2;
  --si-danger-border: #FECACA;
  --si-danger-ring: rgba(220, 38, 38, 0.12);
  --si-overlay: rgba(3, 22, 42, 0.9);
  --si-notice-bg: #FFF7EC;
  --si-notice-border: #FBD9AE;
  --si-notice-text: #6B4A1E;

  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  background: var(--si-page);
  color: var(--si-text);
  font-family: var(--si-display);
}

.login-wrapper.dark {
  --si-page: #07111D;
  --si-panel-border: #16263A;
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
  --si-input-border: #1F3249;
  --si-input-border-hover: #2F4867;
  --si-btn-bg: #1565A6;
  --si-btn-bg-hover: #1A74BE;
  --si-btn-shadow: 0 6px 16px -8px rgba(21, 101, 166, 0.65);
  --si-btn-shadow-hover: 0 10px 22px -10px rgba(21, 101, 166, 0.8);
  --si-danger: #F87171;
  --si-danger-strong: #FECACA;
  --si-danger-text: #FCA5A5;
  --si-danger-bg: rgba(248, 113, 113, 0.08);
  --si-danger-border: rgba(248, 113, 113, 0.28);
  --si-danger-ring: rgba(248, 113, 113, 0.18);
  --si-overlay: rgba(2, 8, 16, 0.92);
  --si-notice-bg: rgba(254, 147, 18, 0.07);
  --si-notice-border: rgba(254, 147, 18, 0.25);
  --si-notice-text: #F2C894;
}

/* ── Brand / console side ── */
.brand {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex; flex-direction: column;
  padding: 2.5rem clamp(2rem, 4.5vw, 4.5rem);
  background: linear-gradient(155deg, #052440 0%, #0A3D66 55%, #0D4F80 100%);
  color: #fff;
}
.dark .brand { background: linear-gradient(155deg, #020B16 0%, #04182C 55%, #072A4A 100%); }

.brand-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.brand-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
}
/* The mark as faint architectural line art */
.brand-mark {
  position: absolute; right: -14%; bottom: -12%;
  width: 82%; height: auto;
  fill: none; stroke: rgba(255, 255, 255, 0.08); stroke-width: 1.2;
}
.brand-mark path { vector-effect: non-scaling-stroke; }
.brand-mark-accent { stroke: rgba(254, 147, 18, 0.4); fill: rgba(254, 147, 18, 0.05); }

/* Large logo on a white plate, so the navy wordmark reads in both themes */
.logo-plate {
  align-self: flex-start;
  padding: 1.1rem 1.6rem;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.55);
  animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.logo { display: block; height: clamp(64px, 6.2vw, 92px); width: auto; max-width: 100%; }

.brand-body {
  flex: 1;
  display: flex; flex-direction: column; justify-content: center;
  padding: 3rem 0 2.5rem;
  max-width: 560px;
  animation: rise 0.7s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.eyebrow {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  background: rgba(254, 147, 18, 0.12);
  border: 1px solid rgba(254, 147, 18, 0.35);
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  color: #FFC27A;
}
.eyebrow svg { width: 15px; height: 15px; }

.brand-title {
  margin: 1.1rem 0 0;
  font-size: clamp(2.5rem, 4.2vw, 3.6rem);
  font-weight: 700; line-height: 1.05; letter-spacing: -0.02em;
}
.brand-title .accent { color: var(--si-accent); }

.brand-desc {
  margin: 1rem 0 0;
  font-size: 1.05rem; line-height: 1.6;
  color: rgba(226, 236, 248, 0.8);
}

.caps {
  list-style: none; margin: 2.25rem 0 0; padding: 0;
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem;
}
.cap {
  display: flex; align-items: flex-start; gap: 0.8rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.cap-icon {
  flex-shrink: 0;
  width: 38px; height: 38px; border-radius: 10px;
  display: grid; place-items: center;
  background: rgba(255, 255, 255, 0.08);
  color: #FFB65C;
}
.cap-icon svg { width: 20px; height: 20px; }
.cap-text { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.cap-text strong { font-size: 0.9rem; font-weight: 600; color: #fff; }
.cap-text span { font-size: 0.78rem; line-height: 1.4; color: rgba(226, 236, 248, 0.65); }

.brand-foot {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem; color: rgba(226, 236, 248, 0.6);
}
.env { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 500; color: rgba(226, 236, 248, 0.85); }
.env-dot { width: 8px; height: 8px; border-radius: 50%; background: #34D399; box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.2); }
.env-dot--dev { background: var(--si-accent); box-shadow: 0 0 0 3px rgba(254, 147, 18, 0.2); }

/* ── Sign-in side ── */
.panel {
  display: flex; flex-direction: column;
  padding: 1.75rem clamp(1.5rem, 4vw, 3.5rem) 1.5rem;
  background: var(--si-surface);
  border-left: 1px solid var(--si-panel-border);
}

.panel-top { display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; }
.secure-tag {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: var(--si-page);
  border: 1px solid var(--si-panel-border);
  font-size: 0.78rem; font-weight: 500; color: var(--si-text-muted);
}
.secure-tag svg { width: 14px; height: 14px; color: var(--si-primary); }
.theme-toggle {
  width: 38px; height: 38px; border-radius: 10px;
  display: grid; place-items: center;
  border: 1px solid var(--si-panel-border); cursor: pointer;
  background: var(--si-surface); color: var(--si-text-muted);
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.theme-toggle:hover { color: var(--si-text); border-color: var(--si-input-border-hover); background: var(--si-page); }
.theme-toggle:focus-visible { outline: 2px solid var(--si-primary); outline-offset: 2px; }
.theme-toggle svg { width: 18px; height: 18px; }

.panel-body {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 2.5rem 0;
}
.form-wrap { width: 100%; max-width: 420px; animation: rise 0.7s 0.14s cubic-bezier(0.16, 1, 0.3, 1) both; }

.notice {
  display: flex; gap: 0.7rem;
  margin-top: 2rem;
  padding: 0.9rem 1rem;
  border-radius: 10px;
  background: var(--si-notice-bg);
  border: 1px solid var(--si-notice-border);
  color: var(--si-notice-text);
}
.notice svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; color: var(--si-accent); }
.notice p { margin: 0; font-size: 0.8rem; line-height: 1.5; }
.notice strong { font-weight: 600; }

.panel-foot {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem 1.5rem;
  font-size: 0.78rem; color: var(--si-text-muted);
}
.foot-am { font-weight: 500; }

@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

/* ── Responsive ── */
@media (max-width: 1180px) {
  .caps { grid-template-columns: 1fr; }
  .cap:nth-child(n + 3) { display: none; }
}

@media (max-width: 960px) {
  .login-wrapper { grid-template-columns: 1fr; }
  .brand { padding: 1.5rem 1.5rem 1.75rem; }
  .brand-mark { width: 120%; right: -40%; bottom: -30%; }
  .brand-body { padding: 1.75rem 0 0; }
  .brand-title { font-size: 2.25rem; }
  .brand-desc, .caps, .brand-foot { display: none; }
  .panel { border-left: none; padding: 1.25rem 1.5rem; }
  .panel-body { padding: 1.5rem 0 2rem; align-items: flex-start; }
}

@media (max-width: 560px) {
  .brand { padding: 1rem 1rem 1.5rem; }
  .logo-plate { align-self: stretch; padding: 0.85rem 1rem; border-radius: 14px; }
  .logo { height: auto; width: 100%; }
  .brand-title { font-size: 1.9rem; }
  .panel { padding: 1rem; }
  .panel-foot { flex-direction: column; align-items: center; text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .logo-plate, .brand-body, .form-wrap { animation: none !important; }
}
</style>
