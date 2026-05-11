<script setup>
import { useRouter } from 'vue-router';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useAuthStore } from '@/stores/auth';
import { computed, ref } from 'vue';
import imageSrc from '@/assets/img/profile.png';

const router = useRouter();
const moduleStore = useModuleStore();
const authStore = useAuthStore();

const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const userName = computed(() => {
  return [u.value?.firstName, u.value?.fatherName].filter(Boolean).join(' ') || 'there';
});
const userRole = computed(() => u.value?.roleName || 'Admin');
const profilePicture = computed(() => {
  const data = authStore.imageData || u.value?.imageData || u.value?.image || null;
  if (!data) return imageSrc;
  if (typeof data === 'string' && data.startsWith('data:image/')) return data;
  return `data:image/png;base64,${data}`;
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

const showUserMenu = ref(false);

function selectModule(mod) {
  moduleStore.selectModule(mod.id);
  router.push(mod.dashboardPath);
}

function logout() {
  showUserMenu.value = false;
  authStore.logout();
}

function goProfile() {
  showUserMenu.value = false;
  router.push('/profile');
}
</script>

<template>
  <div class="ml-root">

    <!-- ══ HEADER ══ -->
    <div class="ml-header">
      <div class="ml-header-orb ml-orb1"></div>
      <div class="ml-header-orb ml-orb2"></div>
      <div class="ml-header-dots"></div>

      <!-- Collapsed bar (always visible) -->
      <div class="ml-header-bar">
        <div class="ml-bar-left">
          <div class="ml-bar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="width:20px;height:20px;color:#fff">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span class="ml-bar-greeting">{{ greeting }}, <strong>{{ userName }}</strong></span>
          <span class="ml-bar-sep">·</span>
          <span class="ml-bar-subtitle">Select your module</span>
        </div>
        <div class="ml-bar-right">
          <div class="ml-bar-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            {{ MODULES.length }} Modules
          </div>
          <div class="ml-bar-chip ml-chip-green">
            <span class="ml-bar-pulse"></span>
            Online
          </div>

          <!-- User menu -->
          <div class="ml-user-wrap" @click.stop="showUserMenu = !showUserMenu">
            <button class="ml-user-btn">
              <div class="ml-user-avatar">
                <img :src="profilePicture" alt="avatar" class="ml-avatar-img" />
                <span class="ml-avatar-dot"></span>
              </div>
              <div class="ml-user-info">
                <span class="ml-user-name">{{ userName }}</span>
                <span class="ml-user-role">{{ userRole }}</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-user-chevron" :class="{ 'ml-chevron-open': showUserMenu }">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- Dropdown -->
            <Transition name="ml-drop">
              <div v-if="showUserMenu" class="ml-user-menu" @click.stop>
                <div class="ml-menu-head">
                  <div class="ml-menu-avatar">
                    <img :src="profilePicture" alt="avatar" class="ml-avatar-img" />
                  </div>
                  <div class="ml-menu-info">
                    <p class="ml-menu-name">{{ userName }}</p>
                    <p class="ml-menu-email">{{ u?.email || '' }}</p>
                    <span class="ml-menu-role-pill">{{ userRole }}</span>
                  </div>
                </div>
                <div class="ml-menu-body">
                  <button class="ml-menu-item" @click="goProfile">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    My Profile
                  </button>
                  <div class="ml-menu-divider"></div>
                  <button class="ml-menu-item ml-menu-danger" @click="logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Expanded content (revealed on hover) -->
      <div class="ml-header-inner">
        <div class="ml-logo-row">
          <div class="ml-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="width:28px;height:28px;color:#fff">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span class="ml-logo-text">HealthConnect</span>
        </div>
        <h1 class="ml-heading">
          {{ greeting }}, <span class="ml-heading-name">{{ userName }}</span>
        </h1>
        <p class="ml-subheading">Select an insurance module to get started</p>
        <div class="ml-chips">
          <div class="ml-chip">
            <span class="ml-chip-dot"></span>
            {{ MODULES.length }} modules available
          </div>
          <div class="ml-chip ml-chip-green">
            <span class="ml-chip-dot ml-dot-green"></span>
            All systems online
          </div>
        </div>
      </div>
    </div>

    <!-- ══ MODULE GRID ══ -->
    <div class="ml-body">
      <div class="ml-section-label">
        <div class="ml-label-line"></div>
        <span>Choose Your Module</span>
        <div class="ml-label-line"></div>
      </div>

      <div class="ml-grid">
        <div
          v-for="(mod, i) in MODULES"
          :key="mod.id"
          class="ml-card"
          :style="`--from:${mod.color.from};--to:${mod.color.to};--glow:${mod.color.glow};animation-delay:${i * 60}ms`"
          @click="selectModule(mod)"
        >
          <!-- Shine -->
          <div class="ml-card-shine"></div>

          <!-- Badge -->
          <div v-if="mod.badge" class="ml-badge">{{ mod.badge }}</div>

          <!-- Icon -->
          <div class="ml-card-top">
            <div class="ml-icon-wrap" v-html="mod.icon"></div>
          </div>

          <!-- Content -->
          <div class="ml-card-body">
            <h3 class="ml-card-title">{{ mod.name }}</h3>
            <p class="ml-card-desc">{{ mod.description }}</p>
          </div>

          <!-- Footer -->
          <div class="ml-card-footer">
            <span>Open module</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-footer-arrow">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ═══════════════════════ ROOT ═══════════════════════ */
.ml-root {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════ HEADER ═══════════════════════ */
.ml-header {
  position: relative;
  background: linear-gradient(140deg, #0f172a 0%, #0f2560 55%, #0a1f4e 100%);
  overflow: hidden;
  text-align: center;
  /* Collapsed state */
  max-height: 4.5rem;
  padding: 1.25rem 2rem;
  transition: max-height 0.55s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s ease;
  border-bottom: 2px solid transparent;
  background-clip: padding-box;
}
/* Expanded on hover */
.ml-header:hover {
  max-height: 20rem;
  padding: 3.5rem 2rem 4rem;
  border-bottom-color: rgba(59,130,246,0.4);
}

.ml-header-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.ml-orb1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%);
  top: -200px; left: -100px;
  animation: orbDrift 18s ease-in-out infinite;
}
.ml-orb2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%);
  bottom: -100px; right: 5%;
  animation: orbDrift 24s ease-in-out infinite reverse;
}
@keyframes orbDrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(30px,-20px) scale(1.06); }
  66%      { transform: translate(-20px,18px) scale(0.94); }
}
.ml-header-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

/* ── Collapsed bar (always visible) ── */
.ml-header-bar {
  position: relative; z-index: 2;
  height: 4.5rem; display: flex;
  align-items: center; justify-content: space-between;
  padding: 0 2rem; flex-shrink: 0;
}
.ml-bar-left { display: flex; align-items: center; gap: 0.5rem; }
.ml-bar-logo {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, rgba(59,130,246,0.4), rgba(14,165,233,0.2));
  border: 1px solid rgba(59,130,246,0.5);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 12px rgba(59,130,246,0.25);
  flex-shrink: 0;
}
.ml-bar-greeting {
  font-size: 0.875rem; font-weight: 600; color: rgba(255,255,255,0.85);
}
.ml-bar-greeting strong {
  background: linear-gradient(90deg, #60a5fa, #34d399);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ml-bar-sep { color: rgba(255,255,255,0.2); font-size: 1rem; }
.ml-bar-subtitle {
  font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 0.08em;
}
.ml-bar-right { display: flex; align-items: center; gap: 0.5rem; }
.ml-bar-chip {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.28rem 0.75rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 9999px;
  font-size: 0.7rem; font-weight: 600;
  color: rgba(255,255,255,0.55);
  white-space: nowrap;
}
.ml-bar-chip.ml-chip-green {
  border-color: rgba(52,211,153,0.3);
  color: #6ee7b7;
}
.ml-bar-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399; flex-shrink: 0;
  animation: dotPulse 1.8s ease-in-out infinite;
}

/* ── Expanded content (hidden by default) ── */
.ml-header-inner {
  position: relative; z-index: 2;
  max-width: 600px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  /* Collapsed: hide expanded content */
  opacity: 0;
  transform: translateY(-12px);
  transition: opacity 0.4s ease 0.1s, transform 0.45s cubic-bezier(0.34,1.3,0.64,1) 0.08s;
  pointer-events: none;
}
.ml-header:hover .ml-header-inner {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.ml-logo-row {
  display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;
}
.ml-logo-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: linear-gradient(135deg, #1d4ed8, #059669);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(5,150,105,0.35);
}
.ml-logo-text {
  font-size: 1.25rem; font-weight: 800; color: #fff;
  letter-spacing: -0.02em;
}

.ml-heading {
  font-size: clamp(1.875rem, 4vw, 2.75rem);
  font-weight: 900; color: #fff;
  line-height: 1.1; letter-spacing: -0.03em;
}
.ml-heading-name {
  background: linear-gradient(90deg, #60a5fa 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ml-subheading {
  font-size: 1rem; color: rgba(255,255,255,0.5); line-height: 1.6;
}

.ml-chips {
  display: flex; gap: 0.625rem; flex-wrap: wrap; justify-content: center;
  margin-top: 0.25rem;
}
.ml-chip {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.875rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9999px;
  font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.55);
}
.ml-chip-green { border-color: rgba(52,211,153,0.3); color: #6ee7b7; }
.ml-chip-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.4);
  animation: dotPulse 1.8s ease-in-out infinite;
}
.ml-dot-green { background: #34d399; }
@keyframes dotPulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(0.7); }
}

/* ═══════════════════════ BODY ═══════════════════════ */
.ml-body {
  flex: 1;
  padding: 2.5rem 2rem 4rem;
  max-width: 1500px;
  margin: 0 auto;
  width: 100%;
}

.ml-section-label {
  display: flex; align-items: center; gap: 0.875rem; margin-bottom: 1.75rem;
}
.ml-label-line {
  flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, #cbd5e1 50%, transparent);
}
.ml-section-label span {
  font-size: 0.6875rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #94a3b8; white-space: nowrap;
}

/* ═══════════════════════ GRID ═══════════════════════ */
.ml-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.125rem;
}

/* ═══════════════════════ CARD ═══════════════════════ */
.ml-card {
  position: relative;
  border-radius: 1.125rem;
  overflow: hidden;
  background: linear-gradient(145deg, var(--from), var(--to));
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex; flex-direction: column;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.22s ease;
  animation: cardIn 0.5s cubic-bezier(0.34,1.2,0.64,1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.ml-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 24px 56px var(--glow), 0 4px 18px rgba(0,0,0,0.2);
}

.ml-card-shine {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.2) 0%, transparent 55%);
  pointer-events: none;
}

.ml-badge {
  position: absolute; top: 0.875rem; right: 0.875rem;
  font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff; backdrop-filter: blur(4px);
}

.ml-card-top {
  padding: 1.375rem 1.375rem 0;
}
.ml-icon-wrap {
  width: 3.25rem; height: 3.25rem; border-radius: 1rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.22);
  display: flex; align-items: center; justify-content: center;
  color: #fff; backdrop-filter: blur(4px);
}
.ml-icon-wrap :deep(svg) { width: 1.625rem; height: 1.625rem; }

.ml-card-body {
  padding: 0.875rem 1.375rem 0.75rem;
  flex: 1;
}
.ml-card-title {
  font-size: 1.125rem; font-weight: 800; color: #fff;
  margin-bottom: 0.5rem; line-height: 1.2; letter-spacing: -0.015em;
}
.ml-card-desc {
  font-size: 0.8rem; color: rgba(255,255,255,0.6); line-height: 1.6;
}

.ml-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.375rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.12);
  font-size: 0.775rem; font-weight: 700; color: rgba(255,255,255,0.6);
  transition: all 0.15s ease;
}
.ml-card:hover .ml-card-footer { background: rgba(0,0,0,0.22); color: #fff; }
.ml-footer-arrow {
  width: 0.9rem; height: 0.9rem;
  transition: transform 0.15s ease;
}
.ml-card:hover .ml-footer-arrow { transform: translateX(4px); }

/* ═══════════════════════ USER MENU ═══════════════════════ */
.ml-user-wrap { position: relative; }
.ml-user-btn {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.25rem 0.625rem 0.25rem 0.25rem;
  border-radius: 2rem;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  cursor: pointer; transition: all 0.15s;
}
.ml-user-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(59,130,246,0.4); }
.ml-user-avatar {
  position: relative; width: 30px; height: 30px;
  border-radius: 50%; overflow: hidden; flex-shrink: 0;
  border: 2px solid rgba(59,130,246,0.4);
}
.ml-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ml-avatar-dot {
  position: absolute; bottom: 0; right: 0;
  width: 8px; height: 8px; border-radius: 50%;
  background: #34d399; border: 1.5px solid #0f172a;
}
.ml-user-info { display: flex; flex-direction: column; line-height: 1.2; }
.ml-user-name { font-size: 0.72rem; font-weight: 700; color: #fff; white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis; }
.ml-user-role { font-size: 0.6rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; }
.ml-user-chevron { width: 0.5rem; height: 0.5rem; color: rgba(255,255,255,0.35); transition: transform 0.2s; flex-shrink: 0; }
.ml-chevron-open { transform: rotate(180deg); }

.ml-user-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 220px;
  background: #0f172a;
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.55);
  overflow: hidden; z-index: 9999;
}
.ml-menu-head {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(30,64,175,0.4), rgba(14,165,233,0.15));
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ml-menu-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.15);
}
.ml-menu-name { font-size: 0.825rem; font-weight: 700; color: #fff; }
.ml-menu-email { font-size: 0.68rem; color: rgba(255,255,255,0.45); margin-top: 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
.ml-menu-role-pill {
  display: inline-block; margin-top: 0.25rem;
  padding: 0.1rem 0.5rem; border-radius: 9999px;
  background: rgba(59,130,246,0.25); color: #93c5fd;
  font-size: 0.58rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.ml-menu-body { padding: 0.4rem; }
.ml-menu-item {
  display: flex; align-items: center; gap: 0.6rem;
  width: 100%; padding: 0.5rem 0.75rem;
  border-radius: 0.5rem; border: none; background: transparent;
  color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: 500;
  cursor: pointer; transition: all 0.12s; text-align: left;
}
.ml-menu-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
.ml-menu-danger { color: #f87171; }
.ml-menu-danger:hover { background: rgba(239,68,68,0.12) !important; color: #fca5a5 !important; }
.ml-menu-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0.3rem 0; }

.ml-drop-enter-active, .ml-drop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.ml-drop-enter-from, .ml-drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ═══════════════════════ RESPONSIVE ═══════════════════════ */
@media (max-width: 768px) {
  .ml-header { padding: 2.5rem 1.25rem 3rem; }
  .ml-body { padding: 1.5rem 1rem 2.5rem; }
  .ml-grid { grid-template-columns: 1fr 1fr; gap: 0.875rem; }
}
@media (max-width: 480px) {
  .ml-grid { grid-template-columns: 1fr; }
}
</style>
