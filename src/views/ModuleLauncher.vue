<script setup>
import { useRouter } from 'vue-router';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useAuthStore } from '@/stores/auth';
import { useDarkModeStore } from '@/stores/darkMode';
import { useLanguageStore } from '@/stores/languageStore';
import { computed, ref } from 'vue';
import imageSrc from '@/assets/img/profile.png';
import eicLogo from '@/assets/img/logo.png';

const router = useRouter();
const moduleStore = useModuleStore();
const authStore = useAuthStore();
const darkStore = useDarkModeStore();
const langStore = useLanguageStore();

const isDark = computed(() => darkStore.isDark);

const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const userName = computed(() =>
  [u.value?.firstName, u.value?.fatherName].filter(Boolean).join(' ') || 'there'
);
const userRole = computed(() => u.value?.roleName || 'Admin');
const profilePicture = computed(() => {
  const data = authStore.imageData || u.value?.imageData || u.value?.image || null;
  if (!data) return imageSrc;
  if (typeof data === 'string' && data.startsWith('data:image/')) return data;
  return `data:image/png;base64,${data}`;
});

const greetingKey = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning';
  if (h < 17) return 'goodAfternoon';
  return 'goodEvening';
});

const greeting = computed(() => langStore.t(greetingKey.value));

const showUserMenu = ref(false);
const hoveredModule = ref(null);

function selectModule(mod) {
  moduleStore.selectModule(mod.id);
  router.push(mod.dashboardPath);
}
function logout() { showUserMenu.value = false; authStore.logout(); }
function goProfile() { showUserMenu.value = false; router.push('/profile'); }

/* ═══════ DOCK MAGNIFICATION ═══════ */
const dockRef = ref(null);
const DOCK_MAX = 1.55;
const DOCK_MIN = 0.85;
const DOCK_RADIUS = 220;
const DOCK_RISE = 38;

function onDockMove(e) {
  if (!dockRef.value) return;
  const cards = dockRef.value.querySelectorAll('.dock-item');
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const dist = Math.abs(e.clientX - cx);
    const p = Math.max(0, 1 - dist / DOCK_RADIUS);
    const curve = p * p * (3 - 2 * p);
    const s = DOCK_MIN + (DOCK_MAX - DOCK_MIN) * curve;
    const rise = DOCK_RISE * curve;
    card.style.transform = `translateY(${-rise}px) scale(${s.toFixed(4)})`;
    card.style.zIndex = curve > 0.1 ? '5' : '1';
  });
}
function onDockLeave() {
  if (!dockRef.value) return;
  dockRef.value.querySelectorAll('.dock-item').forEach((c) => {
    c.style.transform = '';
    c.style.zIndex = '';
  });
}
</script>

<template>
  <div class="ml-root" :class="{ dark: isDark }" @click="showUserMenu = false">
    <!-- Floating Orbs -->
    <div class="ml-orb ml-orb-blue"></div>
    <div class="ml-orb ml-orb-lavender"></div>
    <div class="ml-orb ml-orb-mint"></div>

    <!-- Dark mode toggle -->
    <button class="ml-dark-toggle" @click.stop="darkStore.toggle()" :title="isDark ? 'Light Mode' : 'Dark Mode'">
      <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/><path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    </button>

    <!-- ══ HEADER ══ -->
    <div class="ml-header">
      <div class="ml-header-dots"></div>

      <!-- Bar -->
      <div class="ml-header-bar">
        <div class="ml-bar-left">
          <div class="ml-bar-logo">
            <img :src="eicLogo" alt="EIC" class="ml-bar-logo-img" />
          </div>
          <span class="ml-bar-greeting" v-html="langStore.t('greetingName', { greeting: greeting, name: userName })"></span>
          <span class="ml-bar-sep">·</span>
          <span class="ml-bar-sub">{{ langStore.t('selectModule') }}</span>
        </div>
        <div class="ml-bar-right">
          <div class="ml-bar-chip"><span class="ml-chip-pulse"></span> {{ langStore.t('modulesCount', { count: MODULES.length }) }}</div>
          <div class="ml-bar-chip ml-chip-green"><span class="ml-chip-pulse ml-pulse-green"></span> {{ langStore.t('online') }}</div>
          
          <!-- Language Selector chip -->
          <button class="ml-bar-chip ml-chip-lang" @click.stop="langStore.toggleLanguage()" :title="langStore.isAmharic ? 'English' : 'አማርኛ'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="ml-lang-icon">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
            </svg>
            <span class="ml-lang-text">{{ langStore.isAmharic ? 'English' : 'አማርኛ' }}</span>
          </button>

          <!-- User -->
          <div class="ml-user-wrap" @click.stop="showUserMenu = !showUserMenu">
            <button class="ml-user-btn">
              <div class="ml-user-avatar"><img :src="profilePicture" alt="" /><span class="ml-avatar-dot"></span></div>
              <div class="ml-user-info"><span class="ml-user-name">{{ userName }}</span><span class="ml-user-role">{{ userRole }}</span></div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-user-chev" :class="{'ml-chev-open':showUserMenu}"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <Transition name="ml-drop">
              <div v-if="showUserMenu" class="ml-user-menu" @click.stop>
                <div class="ml-menu-head">
                  <div class="ml-menu-ava"><img :src="profilePicture" alt="" /></div>
                  <div><p class="ml-menu-name">{{ userName }}</p><p class="ml-menu-email">{{ u?.email || '' }}</p><span class="ml-menu-pill">{{ userRole }}</span></div>
                </div>
                <div class="ml-menu-body">
                  <button class="ml-menu-item" @click="goProfile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> {{ langStore.t('myProfile') }}</button>
                  <div class="ml-menu-div"></div>
                  <button class="ml-menu-item ml-menu-danger" @click="logout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> {{ langStore.t('signOut') }}</button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Expanded EIC hero content -->
      <div class="ml-header-inner">
        <div class="ml-eic-hero">
          <div class="ml-eic-logo-wrap">
            <img :src="eicLogo" alt="Ethiopian Insurance Corporation" class="ml-eic-logo" />
          </div>
          <div class="ml-eic-text">
            <div class="ml-eic-label">{{ langStore.t('poweredBy') }}</div>
            <div class="ml-eic-name">{{ langStore.t('eic') }}</div>
            <div class="ml-eic-sub">
              <span class="ml-live-dot"></span>
              {{ langStore.t('platformSubtitle') }}
            </div>
          </div>
        </div>
        
        <h1 class="ml-heading" v-html="langStore.t('greetingName', { greeting: greeting, name: `<span class='ml-heading-hl'>${userName}</span>` })"></h1>
        
        <div class="ml-subheading-wrap">
          <Transition name="ml-fade-slide" mode="out-in">
            <p :key="hoveredModule ? hoveredModule.id : 'default'" class="ml-subheading">
              {{ hoveredModule ? langStore.t('modules.' + hoveredModule.id + 'Desc') : langStore.t('selectModuleToGetStarted') }}
            </p>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ══ DOCK BAR ══ -->
    <div class="ml-dock-wrap">
      <div
        ref="dockRef"
        class="ml-dock"
        @mousemove="onDockMove"
        @mouseleave="onDockLeave"
      >
        <div
          v-for="(mod, i) in MODULES"
          :key="mod.id"
          class="dock-item"
          :style="`--td:${mod.color.to};--tm:${mod.color.from};--ib:${mod.color.from}15;--is:${mod.color.accent};--sh:${mod.color.glow}`"
          @mouseenter="hoveredModule = mod"
          @mouseleave="hoveredModule = null"
          @click="selectModule(mod)"
        >
          <div class="dock-icon-box">
            <div class="dock-icon" v-html="mod.icon"></div>
          </div>
          <span class="dock-label">{{ langStore.t('modules.' + mod.id) }}</span>
          <span v-if="mod.badge" class="dock-badge" :class="{
            'ml-badge-active': mod.badge === 'Active',
            'ml-badge-most': mod.badge === 'Most Used',
            'ml-badge-new': mod.badge === 'New'
          }">{{ mod.badge }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Abyssinica+SIL&display=swap');

/* ── CSS Variables ── */
.ml-root {
  font-family: 'Plus Jakarta Sans', 'Abyssinica SIL', system-ui, sans-serif;
  --ml-bg: linear-gradient(180deg, #f3f5fc 0%, #edf1fc 45%, #f8fafc 100%);
  --ml-header-from: rgba(99,102,241,0.08);
  --ml-header-text: #1e293b;
  --ml-bar-greeting: #334155;
  --ml-bar-sub-color: #64748b;
  --ml-chip-bg: rgba(99,102,241,0.06);
  --ml-chip-border: rgba(99,102,241,0.12);
  --ml-chip-color: #6366f1;
  --ml-orb-opacity: 0.16;
  --ml-orb-blue-color: #c7d2fe;
  --ml-orb-lav-color: #ddd6fe;
  --ml-orb-mint-color: #ccfbf1;
  --ml-dot-bg: rgba(99,102,241,0.03);
  --ml-dock-bg: rgba(255,255,255,0.7);
  --ml-dock-border: rgba(255,255,255,0.6);
  --ml-dock-shadow: 0 20px 50px rgba(99,102,241,0.1);
  --ml-toggle-bg: rgba(255,255,255,0.7);
  --ml-toggle-border: rgba(99,102,241,0.15);
  --ml-toggle-color: #475569;
  --ml-eic-bg: rgba(255,255,255,0.6);
  --ml-eic-border: rgba(255,255,255,0.7);
  --ml-eic-name-color: #0f172a;
  --ml-eic-label-color: #4f46e5;
  --ml-eic-sub-color: #475569;
  --ml-heading-color: #0f172a;
  --ml-subheading-color: #475569;
  --ml-user-bg: rgba(255,255,255,0.6);
  --ml-user-border: rgba(99,102,241,0.12);
  --ml-user-name-color: #1e293b;
  --ml-user-role-color: #4f46e5;
  --ml-menu-bg: rgba(255,255,255,0.85);
  --ml-menu-border: rgba(255,255,255,0.9);
  --ml-user-chev-color: rgba(71,85,105,0.5);
}

.ml-root.dark {
  --ml-bg: linear-gradient(180deg, #090d16 0%, #0f172a 45%, #0b0f19 100%);
  --ml-header-from: transparent;
  --ml-header-text: #f1f5f9;
  --ml-bar-greeting: rgba(255,255,255,0.8);
  --ml-bar-sub-color: rgba(255,255,255,0.4);
  --ml-chip-bg: rgba(255,255,255,0.04);
  --ml-chip-border: rgba(255,255,255,0.08);
  --ml-chip-color: rgba(255,255,255,0.6);
  --ml-orb-opacity: 0.22;
  --ml-orb-blue-color: #1e1b4b;
  --ml-orb-lav-color: #2e1065;
  --ml-orb-mint-color: #042f2e;
  --ml-dot-bg: rgba(255,255,255,0.01);
  --ml-dock-bg: rgba(15,23,42,0.6);
  --ml-dock-border: rgba(255,255,255,0.08);
  --ml-dock-shadow: 0 20px 50px rgba(0,0,0,0.5);
  --ml-toggle-bg: rgba(15,23,42,0.6);
  --ml-toggle-border: rgba(255,255,255,0.08);
  --ml-toggle-color: rgba(255,255,255,0.7);
  --ml-eic-bg: rgba(15,23,42,0.4);
  --ml-eic-border: rgba(255,255,255,0.06);
  --ml-eic-name-color: #ffffff;
  --ml-eic-label-color: #818cf8;
  --ml-eic-sub-color: rgba(255,255,255,0.5);
  --ml-heading-color: #ffffff;
  --ml-subheading-color: rgba(255,255,255,0.6);
  --ml-user-bg: rgba(15,23,42,0.4);
  --ml-user-border: rgba(255,255,255,0.08);
  --ml-user-name-color: #ffffff;
  --ml-user-role-color: rgba(129,140,248,0.8);
  --ml-menu-bg: rgba(15,23,42,0.9);
  --ml-menu-border: rgba(255,255,255,0.08);
  --ml-user-chev-color: rgba(255,255,255,0.3);
}

.ml-root {
  min-height: 100vh;
  background: var(--ml-bg);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  transition: background 0.4s ease;
}

/* Orbs with slow float animations */
.ml-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: var(--ml-orb-opacity); pointer-events: none; z-index: 0; transition: opacity 0.4s ease, filter 0.4s; }
.ml-orb-blue     { width: 600px; height: 600px; background: var(--ml-orb-blue-color); top: -200px; left: -150px; animation: orbFloat1 22s ease-in-out infinite alternate; }
.ml-orb-lavender { width: 500px; height: 500px; background: var(--ml-orb-lav-color);  top: -100px; right: -150px; animation: orbFloat2 25s ease-in-out infinite alternate; }
.ml-orb-mint     { width: 550px; height: 550px; background: var(--ml-orb-mint-color); bottom: -200px; left: 50%; transform: translateX(-50%); animation: orbFloat3 20s ease-in-out infinite alternate; }

@keyframes orbFloat1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, 40px) scale(1.08); }
  100% { transform: translate(-30px, -20px) scale(0.95); }
}
@keyframes orbFloat2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, 60px) scale(1.1); }
  100% { transform: translate(20px, -30px) scale(0.98); }
}
@keyframes orbFloat3 {
  0% { transform: translateX(-50%) translateY(0) scale(1); }
  50% { transform: translateX(-45%) translateY(-50px) scale(1.05); }
  100% { transform: translateX(-55%) translateY(30px) scale(0.96); }
}

/* Dark toggle */
.ml-dark-toggle {
  position: fixed; top: 1.25rem; right: 1.25rem; z-index: 200;
  width: 42px; height: 42px; border-radius: 50%;
  border: 1.5px solid var(--ml-toggle-border);
  background: var(--ml-toggle-bg);
  color: var(--ml-toggle-color);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease; backdrop-filter: blur(12px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
}
.ml-dark-toggle:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 4px 20px rgba(99,102,241,0.25); }
.ml-dark-toggle svg { width: 18px; height: 18px; }

/* Header */
.ml-header {
  flex: 1; display: flex; flex-direction: column; z-index: 50;
  background: transparent; overflow: hidden; text-align: center; padding: 1.5rem 2rem 0;
  transition: all 0.4s ease;
}
.ml-header-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(var(--ml-dot-bg) 1.5px, transparent 1.5px);
  background-size: 32px 32px; pointer-events: none;
  transition: background-image 0.4s ease;
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
}

/* Bar */
.ml-header-bar {
  position: relative; z-index: 2; display: flex; align-items: center;
  justify-content: space-between; flex-shrink: 0; margin-bottom: 2rem;
}
.ml-bar-left  { display: flex; align-items: center; gap: .6rem; }
.ml-bar-logo  {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(99,102,241,0.1);
  border: 1.5px solid rgba(99,102,241,0.2);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; padding: 5px;
}
.ml-bar-logo-img { width: 100%; height: 100%; object-fit: contain; }
.ml-bar-greeting { font-size: .85rem; font-weight: 600; color: var(--ml-bar-greeting); transition: color 0.4s; }
.ml-bar-greeting :deep(strong) { background: linear-gradient(90deg, #6366f1, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.ml-bar-sep { color: rgba(100,116,139,0.3); font-size: 1rem; }
.ml-bar-sub { font-size: .72rem; font-weight: 700; color: var(--ml-bar-sub-color); text-transform: uppercase; letter-spacing: .08em; transition: color 0.4s; }
.ml-bar-right { display: flex; align-items: center; gap: .6rem; margin-right: 3.5rem; }
.ml-bar-chip {
  display: flex; align-items: center; gap: .35rem;
  padding: .35rem .8rem;
  background: var(--ml-chip-bg); border: 1.5px solid var(--ml-chip-border);
  border-radius: 9999px; font-size: .72rem; font-weight: 600;
  color: var(--ml-chip-color); white-space: nowrap;
  transition: all 0.4s ease;
}
.ml-chip-green { border-color: rgba(52,211,153,.25); color: #059669; }
.ml-chip-pulse { width: 6px; height: 6px; border-radius: 50%; background: rgba(99,102,241,0.5); flex-shrink: 0; }
.ml-pulse-green { background: #10b981; animation: dotP 1.8s ease-in-out infinite; }

.ml-chip-lang {
  cursor: pointer;
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.2);
}
.ml-chip-lang:hover {
  background: rgba(99,102,241,0.15);
  border-color: #6366f1;
  transform: translateY(-1px);
}
.ml-lang-icon {
  width: 14px; height: 14px; color: #6366f1;
}

@keyframes dotP { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:.4; transform:scale(.7) } }

/* EIC Hero */
.ml-header-inner {
  position: relative; z-index: 2; max-width: 800px; margin: auto;
  display: flex; flex-direction: column; align-items: center; gap: 1rem;
  opacity: 1; pointer-events: auto;
}

.ml-eic-hero {
  display: flex; align-items: center; gap: 1.5rem;
  padding: 1.5rem 2rem;
  background: var(--ml-eic-bg);
  border: 1.5px solid var(--ml-eic-border);
  border-radius: 1.5rem;
  backdrop-filter: blur(24px);
  box-shadow: 0 10px 30px rgba(99,102,241,0.05);
  transition: all 0.4s ease, border-color 0.4s;
  margin-bottom: 1rem;
}

.ml-eic-logo-wrap {
  width: 80px; height: 80px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  display: flex; align-items: center; justify-content: center;
  padding: 12px; box-sizing: border-box; flex-shrink: 0;
  animation: eicPulse 3s ease-in-out infinite;
  box-shadow: 0 6px 28px rgba(99,102,241,0.25);
}
@keyframes eicPulse {
  0%,100% { box-shadow: 0 6px 24px rgba(99,102,241,0.2); transform: scale(1); }
  50%      { box-shadow: 0 6px 36px rgba(99,102,241,0.35); transform: scale(1.02); }
}
.ml-eic-logo { width: 100%; height: 100%; object-fit: contain; }

.ml-eic-text { display: flex; flex-direction: column; gap: .25rem; text-align: left; }
.ml-eic-label {
  font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
  color: var(--ml-eic-label-color); transition: color 0.4s;
}
.ml-eic-name {
  font-size: 1.6rem; font-weight: 800;
  color: var(--ml-eic-name-color);
  letter-spacing: -.02em; line-height: 1.2;
  transition: color 0.4s;
}
.ml-eic-sub {
  display: flex; align-items: center; gap: .45rem;
  font-size: .8rem; color: var(--ml-eic-sub-color);
  font-weight: 500; transition: color 0.4s;
}
.ml-live-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0;
  animation: dotP 2s ease-in-out infinite;
}

.ml-heading {
  font-size: clamp(2rem, 4.5vw, 2.8rem);
  font-weight: 800; color: var(--ml-heading-color);
  line-height: 1.15; letter-spacing: -.03em;
  transition: color 0.4s;
}
.ml-heading :deep(.ml-heading-hl) {
  background: linear-gradient(90deg, #6366f1, #059669);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  font-weight: 900;
}

.ml-subheading-wrap {
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.ml-subheading {
  font-size: 1.05rem;
  color: var(--ml-subheading-color);
  font-weight: 500;
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
}

/* Fade-slide transition for hovered descriptions */
.ml-fade-slide-enter-active, .ml-fade-slide-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.ml-fade-slide-enter-from {
  opacity: 0; transform: translateY(8px);
}
.ml-fade-slide-leave-to {
  opacity: 0; transform: translateY(-8px);
}

/* ═══════ DOCK BAR ═══════ */
.ml-dock-wrap {
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1rem 6rem; position: relative; z-index: 100;
}
.ml-dock {
  display: flex; align-items: flex-end; gap: 10px; padding: 18px 28px 20px;
  background: var(--ml-dock-bg);
  backdrop-filter: blur(28px) saturate(1.5);
  border: 1.5px solid var(--ml-dock-border);
  border-radius: 36px;
  box-shadow: var(--ml-dock-shadow);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Dock Item - Colorful Module Cards */
.dock-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; padding: 10px 16px 8px; border-radius: 24px;
  transition: transform .18s cubic-bezier(.22,.68,0,1.2), 
              box-shadow .3s ease, 
              background 0.3s ease;
  transform-origin: bottom center; position: relative; will-change: transform;
}
.dock-item:hover {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px -12px var(--sh), 0 0 0 1px var(--is);
}
.ml-root.dark .dock-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Icon Box - Now colorful! */
.dock-icon-box {
  width: 76px; height: 76px; border-radius: 22px;
  background: linear-gradient(135deg, var(--ib), transparent);
  border: 2px solid rgba(255,255,255,0.4);
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 
              0 6px 20px -8px var(--sh);
  transition: all .3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

/* Glow effect on icon box */
.dock-icon-box::before {
  content: '';
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, var(--sh) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.dock-item:hover .dock-icon-box {
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 
              0 16px 36px -12px var(--sh),
              0 0 0 3px var(--is);
  transform: translateY(-4px) scale(1.05);
  border-color: var(--is);
  background: linear-gradient(135deg, var(--ib), var(--is)20);
}

.dock-item:hover .dock-icon-box::before {
  opacity: 1;
  animation: iconGlow 1.5s ease-in-out infinite;
}

@keyframes iconGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

/* Icon */
.dock-icon { 
  width: 36px; height: 36px; color: var(--is); 
  display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 1;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.dock-icon :deep(svg) { 
  width: 100%; height: 100%; 
  filter: drop-shadow(0 2px 4px var(--sh));
}

.dock-item:hover .dock-icon {
  transform: scale(1.15) rotate(-5deg);
  color: var(--is);
}

/* Label */
.dock-label {
  font-size: 11.5px; font-weight: 700; color: var(--td);
  letter-spacing: -.01em; white-space: nowrap; max-width: 90px;
  overflow: hidden; text-overflow: ellipsis; text-align: center;
  opacity: .85; transition: all .3s ease;
}
.dock-item:hover .dock-label { 
  opacity: 1; 
  font-weight: 800;
  color: var(--td);
  text-shadow: 0 2px 8px var(--sh);
}

/* Badges - Colored */
.dock-badge {
  position: absolute; top: -4px; right: 0px;
  font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  padding: 3px 8px; border-radius: 9999px;
  background: var(--is); 
  color: #fff; 
  line-height: 1.3;
  box-shadow: 0 4px 12px var(--sh);
  pointer-events: none;
  border: 1.5px solid rgba(255,255,255,0.3);
  transition: all 0.3s ease;
}

.dock-item:hover .dock-badge {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--sh);
}

/* Special badge styles */
.ml-badge-active {
  background: linear-gradient(135deg, #059669, #10b981) !important;
  box-shadow: 0 4px 14px rgba(16,185,129,0.4) !important;
  animation: badgePulse 2s ease-in-out infinite;
}

.ml-badge-most {
  background: linear-gradient(135deg, #d97706, #f59e0b) !important;
  box-shadow: 0 4px 14px rgba(245,158,11,0.4) !important;
}

.ml-badge-new {
  background: linear-gradient(135deg, #6d28d9, #8b5cf6) !important;
  box-shadow: 0 4px 14px rgba(139,92,246,0.4) !important;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* User menu */
.ml-user-wrap { position: relative; }
.ml-user-btn {
  display: flex; align-items: center; gap: .5rem;
  padding: 4px 10px 4px 4px; border-radius: 2rem;
  border: 1.5px solid var(--ml-user-border);
  background: var(--ml-user-bg);
  cursor: pointer; transition: all .2s;
  backdrop-filter: blur(8px);
}
.ml-user-btn:hover { border-color: rgba(99,102,241,.35); background: rgba(255,255,255,0.8); }
.ml-root.dark .ml-user-btn:hover { background: rgba(255,255,255,0.06); }
.ml-user-avatar { position: relative; width: 30px; height: 30px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1.5px solid rgba(99,102,241,.35); }
.ml-user-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ml-avatar-dot { position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; border-radius: 50%; background: #10b981; border: 1.5px solid #0f172a; }
.ml-user-info { display: flex; flex-direction: column; line-height: 1.2; text-align: left; }
.ml-user-name { font-size: .72rem; font-weight: 700; color: var(--ml-user-name-color); white-space: nowrap; max-width: 90px; overflow: hidden; text-overflow: ellipsis; transition: color 0.4s; }
.ml-user-role { font-size: .58rem; font-weight: 800; color: var(--ml-user-role-color); text-transform: uppercase; letter-spacing: .05em; transition: color 0.4s; }
.ml-user-chev { width: 11px; height: 11px; color: var(--ml-user-chev-color); transition: transform .25s, color 0.4s; flex-shrink: 0; }
.ml-chev-open { transform: rotate(180deg); }

.ml-user-menu {
  position: absolute; top: calc(100% + 8px); right: 0; width: 220px;
  background: var(--ml-menu-bg); backdrop-filter: blur(28px) saturate(1.5);
  border: 1.5px solid var(--ml-menu-border);
  border-radius: 20px; box-shadow: 0 15px 45px rgba(0,0,0,.15);
  overflow: hidden; z-index: 9999;
}
.ml-menu-head { display: flex; align-items: center; gap: .7rem; padding: .9rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
.ml-menu-ava { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 1.5px solid rgba(99,102,241,0.2); }
.ml-menu-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ml-menu-name { font-size: .82rem; font-weight: 700; color: var(--ml-user-name-color); margin: 0; }
.ml-menu-email { font-size: .65rem; color: #94a3b8; margin: .1rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.ml-menu-pill { display: inline-block; margin-top: .25rem; padding: .12rem .5rem; border-radius: 9999px; background: rgba(99,102,241,.12); color: #6366f1; font-size: .58rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.ml-menu-body { padding: .4rem; }
.ml-menu-item { display: flex; align-items: center; gap: .6rem; width: 100%; padding: .5rem .8rem; border-radius: 12px; border: none; background: transparent; color: var(--ml-user-name-color); font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .15s; text-align: left; opacity: 0.85; }
.ml-menu-item:hover { background: rgba(99,102,241,0.08); opacity: 1; transform: translateX(2px); }
.ml-menu-danger { color: #f43f5e; }
.ml-menu-danger:hover { background: rgba(244,63,94,.08) !important; color: #e11d48 !important; }
.ml-menu-div { height: 1px; background: rgba(255,255,255,0.06); margin: .25rem 0; }

.ml-drop-enter-active, .ml-drop-leave-active { transition: opacity .2s cubic-bezier(0.16, 1, 0.3, 1), transform .2s cubic-bezier(0.16, 1, 0.3, 1); }
.ml-drop-enter-from, .ml-drop-leave-to { opacity: 0; transform: translateY(-8px) scale(.95); }

/* Responsive */
@media (max-width: 768px) {
  .ml-dock { gap: 6px; padding: 14px 18px 16px; border-radius: 28px; }
  .dock-icon-box { width: 56px; height: 56px; border-radius: 16px; }
  .dock-icon { width: 28px; height: 28px; }
  .dock-label { font-size: 9.5px; max-width: 68px; }
  .ml-header-bar { padding: 0 0.5rem; }
  .ml-bar-sub, .ml-bar-sep { display: none; }
  .ml-eic-hero { flex-direction: column; text-align: center; padding: 1.25rem; gap: 1rem; }
  .ml-eic-text { text-align: center; }
  .ml-bar-right { margin-right: 0; }
}
@media (max-width: 480px) {
  .ml-dock { flex-wrap: wrap; border-radius: 24px; justify-content: center; }
  .ml-dock-wrap { align-items: center; padding: 1rem; }
  .ml-bar-right { gap: .4rem; }
  .ml-chip-lang span { display: none; }
}
</style>