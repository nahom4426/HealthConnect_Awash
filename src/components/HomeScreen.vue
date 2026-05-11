<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  navs: { type: Array, default: () => [] },
});

const router = useRouter();
const auth = useAuthStore();

const userName = computed(() =>
  auth.auth?.user?.firstName || "there"
);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
});

const MODULE_COLORS = [
  { from: "#1e3a8a", to: "#2563eb", glow: "rgba(37,99,235,0.4)" },
  { from: "#0c4a6e", to: "#0284c7", glow: "rgba(2,132,199,0.4)" },
  { from: "#064e3b", to: "#059669", glow: "rgba(5,150,105,0.4)" },
  { from: "#4c1d95", to: "#7c3aed", glow: "rgba(124,58,237,0.4)" },
  { from: "#78350f", to: "#d97706", glow: "rgba(217,119,6,0.4)"  },
  { from: "#881337", to: "#e11d48", glow: "rgba(225,29,72,0.4)"  },
  { from: "#134e4a", to: "#0d9488", glow: "rgba(13,148,136,0.4)" },
  { from: "#1e1b4b", to: "#4f46e5", glow: "rgba(79,70,229,0.4)"  },
];

const modules = computed(() =>
  props.navs.map((nav, i) => ({
    ...nav,
    color: MODULE_COLORS[i % MODULE_COLORS.length],
  }))
);

function navigate(path) {
  if (path) router.push(path);
}

function openModule(nav) {
  if (nav.path) router.push(nav.path);
  else if (nav.navs?.length) router.push(nav.navs[0].path);
}
</script>

<template>
  <div class="home-root">

    <!-- ══ COMPACT HERO BANNER (expands on hover) ══ -->
    <section class="hero">
      <div class="hero-orb hero-orb-1"></div>
      <div class="hero-orb hero-orb-2"></div>
      <div class="hero-dots"></div>

      <!-- Collapsed bar (always visible) -->
      <div class="hero-bar">
        <div class="hero-bar-left">
          <span class="badge-dot"></span>
          <span class="hero-bar-greeting">{{ greeting }}, <strong>{{ userName }}</strong></span>
          <span class="hero-bar-sep">·</span>
          <span class="hero-bar-role">{{ auth.auth?.user?.roleName || 'Admin' }}</span>
        </div>
        <div class="hero-bar-right">
          <div class="chip">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            {{ modules.length }} Modules
          </div>
          <div class="chip chip-green">
            <span class="chip-pulse"></span>
            System Online
          </div>
        </div>
      </div>

      <!-- Expanded content (revealed on hover) -->
      <div class="hero-expand">
        <div class="hero-inner">
          <h1 class="hero-heading">
            {{ greeting }},&nbsp;<span class="hero-name">{{ userName }}</span>
          </h1>
          <p class="hero-desc">Choose a module from the navigation above, or jump to any section below.</p>
          <div class="hero-chips">
            <div class="chip">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              {{ modules.length }} Modules
            </div>
            <div class="chip chip-green">
              <span class="chip-pulse"></span>
              System Online
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ MODULE CARDS ══ -->
    <section class="cards-section">
      <div class="cards-label">
        <div class="label-line"></div>
        <span>Quick Access</span>
        <div class="label-line"></div>
      </div>

      <div class="cards-grid">
        <div
          v-for="(mod, idx) in modules"
          :key="mod.name || mod.path"
          class="mod-card"
          :style="`--from:${mod.color.from}; --to:${mod.color.to}; --glow:${mod.color.glow}; animation-delay:${idx * 55}ms`"
          @click="openModule(mod)"
        >
          <div class="mod-shine"></div>

          <div class="mod-top">
            <div class="mod-icon-wrap">
              <span class="mod-icon" v-html="mod.icon" />
            </div>
            <span v-if="mod.navs?.length" class="mod-count">{{ mod.navs.length }}</span>
          </div>

          <div class="mod-body">
            <h3 class="mod-title">{{ mod.name }}</h3>

            <div v-if="mod.navs?.length" class="mod-links">
              <button
                v-for="child in mod.navs.slice(0, 3)"
                :key="child.path"
                class="mod-link"
                @click.stop="navigate(child.path)"
              >
                <span class="mod-link-icon" v-html="child.icon" />
                <span class="mod-link-name">{{ child.name }}</span>
                <svg class="mod-link-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <button v-if="mod.navs.length > 3" class="mod-link mod-link-more" @click.stop="openModule(mod)">
                +{{ mod.navs.length - 3 }} more
              </button>
            </div>
          </div>

          <div class="mod-footer">
            <span>Open module</span>
            <svg class="mod-footer-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
.home-root {
  min-height: 100%;
  background: #f1f5f9;
}

/* ══ HERO ══ */
.hero {
  position: relative;
  background: linear-gradient(140deg, #0f172a 0%, #0f2560 50%, #0a1f4e 100%);
  overflow: hidden;
  /* collapsed height */
  max-height: 3.5rem;
  transition: max-height 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  /* animated gradient border bottom */
  border-bottom: 2px solid transparent;
  background-clip: padding-box;
}

/* Expand on hover */
.hero:hover {
  max-height: 18rem;
  border-bottom-color: rgba(59,130,246,0.4);
}

/* Ambient orbs */
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.hero-orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%);
  top: -100px; left: -100px;
  animation: orbDrift 18s ease-in-out infinite;
}
.hero-orb-2 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%);
  bottom: -60px; right: 8%;
  animation: orbDrift 22s ease-in-out infinite reverse;
}
@keyframes orbDrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(30px,-20px) scale(1.07); }
  66%      { transform: translate(-15px,18px) scale(0.93); }
}

.hero-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

/* ── Collapsed bar (always visible) ── */
.hero-bar {
  position: relative;
  z-index: 2;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  flex-shrink: 0;
}

.hero-bar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hero-bar-greeting {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}
.hero-bar-greeting strong {
  background: linear-gradient(90deg, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-bar-sep {
  color: rgba(255,255,255,0.2);
  font-size: 1rem;
}

.hero-bar-role {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-bar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Expanded content ── */
.hero-expand {
  position: relative;
  z-index: 2;
  overflow: hidden;
  opacity: 0;
  transform: translateY(-12px);
  transition:
    opacity 0.4s ease 0.1s,
    transform 0.45s cubic-bezier(0.34,1.3,0.64,1) 0.08s;
  pointer-events: none;
}
.hero:hover .hero-expand {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.hero-inner {
  position: relative;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  padding: 1.25rem 2rem 2rem;
}

.hero-heading {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.hero-name {
  background: linear-gradient(90deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 0.875rem;
  color: rgba(255,255,255,0.4);
  line-height: 1.6;
  max-width: 440px;
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

/* ── Shared chip ── */
.chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.75rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  white-space: nowrap;
}

.chip-green {
  border-color: rgba(52,211,153,0.3);
  color: #6ee7b7;
}

/* animated green dot */
.badge-dot,
.chip-pulse {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #34d399;
  flex-shrink: 0;
  animation: pulse 1.8s ease-in-out infinite;
}
@keyframes pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.75); }
}

/* ══ CARDS SECTION ══ */
.cards-section {
  padding: 2.5rem 1.5rem 3rem;
  max-width: 1500px;
  margin: 0 auto;
  width: 100%;
}

.cards-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.label-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #cbd5e1 50%, transparent);
}

.cards-label span {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #94a3b8;
  white-space: nowrap;
}

/* ══ CARDS GRID ══ */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

/* ══ MODULE CARD ══ */
.mod-card {
  position: relative;
  border-radius: 1.125rem;
  overflow: hidden;
  background: linear-gradient(145deg, var(--from), var(--to));
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34,1.4,0.64,1),
              box-shadow 0.22s ease;
  animation: cardIn 0.5s cubic-bezier(0.34,1.2,0.64,1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.mod-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 50px var(--glow), 0 4px 16px rgba(0,0,0,0.2);
}

/* shine overlay */
.mod-shine {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.18) 0%, transparent 55%);
  pointer-events: none;
}

/* ── Top ── */
.mod-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.125rem 1.125rem 0;
}

.mod-icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.mod-icon {
  color: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mod-count {
  font-size: 0.6875rem;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 9999px;
  padding: 0.15rem 0.55rem;
}

/* ── Body ── */
.mod-body {
  padding: 0.875rem 1.125rem 0.625rem;
  flex: 1;
}

.mod-title {
  font-size: 1.0625rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.75rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.mod-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mod-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.14s ease;
  text-align: left;
  width: 100%;
}
.mod-link:hover {
  background: rgba(255,255,255,0.18);
  transform: translateX(2px);
}
.mod-link-more {
  background: transparent;
  border: 1px dashed rgba(255,255,255,0.18);
  font-size: 0.7rem;
  color: rgba(255,255,255,0.4);
  font-weight: 600;
  justify-content: center;
}
.mod-link-more:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.65);
}

.mod-link-icon {
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.6);
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}
.mod-link:hover .mod-link-icon { color: rgba(255,255,255,0.9); }

.mod-link-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255,255,255,0.8);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mod-link:hover .mod-link-name { color: #ffffff; }

.mod-link-arrow {
  width: 0.7rem;
  height: 0.7rem;
  color: rgba(255,255,255,0.25);
  flex-shrink: 0;
  transition: transform 0.14s ease, color 0.14s;
}
.mod-link:hover .mod-link-arrow { transform: translateX(2px); color: rgba(255,255,255,0.6); }

/* ── Footer ── */
.mod-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.125rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.12);
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.02em;
  transition: all 0.15s ease;
}
.mod-card:hover .mod-footer {
  background: rgba(0,0,0,0.22);
  color: #ffffff;
}

.mod-footer-arrow {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.15s ease;
}
.mod-card:hover .mod-footer-arrow { transform: translateX(3px); }

/* ── Responsive ── */
@media (max-width: 640px) {
  .hero { padding: 3rem 1.25rem 4rem; }
  .cards-section { padding: 1.5rem 1rem 2rem; }
  .cards-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
}
@media (max-width: 480px) {
  .cards-grid { grid-template-columns: 1fr; }
}
</style>
