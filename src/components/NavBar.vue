<script setup>
import { useAuthStore } from "@/stores/auth";
import { useDarkModeStore } from "@/stores/darkMode";
import { ref, computed } from "vue";
import imageSrc from "@/assets/img/profile.png";
import { useRouter } from "vue-router";

const props = defineProps({
  breadcrumbs: Object,
  navs: { type: Array, default: () => [] },
});

const router    = useRouter();
const authStore = useAuthStore();
const darkStore = useDarkModeStore();
const isDark    = computed(() => darkStore.isDark);

// ── Collapse state ──
const collapsed  = ref(false);
const openGroups = ref({});

// ── Auth ──
const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const profilePicture = computed(() => {
  const data = authStore.imageData || u.value?.imageData || u.value?.image || null;
  if (!data) return imageSrc;
  if (typeof data === "string" && data.startsWith("data:image/")) return data;
  return `data:image/png;base64,${data}`;
});
const userName     = computed(() => [u.value?.firstName, u.value?.fatherName].filter(Boolean).join(" ") || "User");
const userRole     = computed(() => u.value?.roleName || 'Admin');
const userInitials = computed(() => userName.value.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase());

function handleImageError(e) { e.target.src = imageSrc; }
function logout() { authStore.logout(); }
function toggleCollapse() { collapsed.value = !collapsed.value; }

// ── Nav group toggle — accordion: close others, open clicked ──
function toggleGroup(idx) {
  if (collapsed.value) { collapsed.value = false; }
  const isOpen = openGroups.value[idx];
  openGroups.value = {}; // close all
  if (!isOpen) openGroups.value = { [idx]: true }; // open clicked if it was closed
}

function navigate(path) {
  if (path) router.push(path);
}
</script>

<template>
  <!-- ════════ LEFT SIDEBAR ════════ -->
  <aside class="sidebar" :class="{ 'sidebar-collapsed': collapsed, 'sidebar-light': !isDark }">

    <!-- Top accent stripe -->
    <div class="sidebar-accent"></div>

    <!-- Brand + collapse toggle -->
    <div class="sidebar-brand">
      <template v-if="!collapsed">
        <div class="brand-mark" @click="navigate('/module-select')" title="Switch module">
          <img src="/src/assets/img/standard_icon.png" alt="Standard Logo" class="brand-logo-img" />
        </div>
        <div class="brand-text" @click="navigate('/module-select')">
          <span class="brand-name">Standard Insurance S.C.</span>
          <span class="brand-sub">Your trust, our standard</span>
        </div>
        <button class="collapse-btn" @click="toggleCollapse" title="Collapse sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="collapse-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </template>

      <!-- Clean Single Centered Logo/Toggle in Collapsed Mode -->
      <template v-else>
        <button class="brand-collapsed-mark" @click="toggleCollapse" title="Expand sidebar">
          <img src="/src/assets/img/standard_icon.png" alt="Standard Logo" class="brand-logo-img" />
          <div class="brand-expand-overlay" title="Expand sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="expand-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
            </svg>
          </div>
        </button>
      </template>
    </div>

    <!-- Main nav items -->
    <nav class="sidebar-nav" aria-label="Main navigation">
      <div v-for="(nav, idx) in navs" :key="nav.name || nav.path" class="nav-group">

        <!-- Direct link -->
        <button
          v-if="nav.path && !nav.navs"
          class="nav-item"
          :class="{ 'nav-item-active': $route.path === nav.path }"
          :title="collapsed ? nav.name : ''"
          @click="navigate(nav.path)"
        >
          <span class="nav-item-icon" v-html="nav.icon" />
          <span v-if="!collapsed" class="nav-item-label">{{ nav.name }}</span>
        </button>

        <!-- Group with children -->
        <template v-else>
          <button
            class="nav-item nav-item-group"
            :class="{ 'nav-item-open': openGroups[idx] && !collapsed }"
            :title="collapsed ? nav.name : ''"
            @click="toggleGroup(idx)"
          >
            <span class="nav-item-icon" v-html="nav.icon" />
            <span v-if="!collapsed" class="nav-item-label">{{ nav.name }}</span>
            <svg
              v-if="!collapsed"
              class="nav-chevron"
              :class="{ 'nav-chevron-open': openGroups[idx] }"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Sub-items (only when expanded) -->
          <Transition name="sub-expand">
            <div v-if="openGroups[idx] && !collapsed" class="nav-sub">
              <button
                v-for="child in nav.navs"
                :key="child.path"
                class="nav-sub-item"
                :class="{ 'nav-sub-item-active': $route.path === child.path }"
                @click="navigate(child.path)"
              >
                <span class="nav-sub-icon" v-html="child.icon" />
                <span class="nav-sub-label">{{ child.name }}</span>
              </button>
            </div>
          </Transition>
        </template>

      </div>
    </nav>

    <!-- Spacer -->
    <div class="sidebar-spacer"></div>

    <!-- Profile card -->
    <div class="sidebar-profile">
      <div class="profile-card" :class="{ 'profile-card-collapsed': collapsed }">
        <div class="profile-avatar" @click="navigate('/profile')" :title="collapsed ? userName : ''">
          <img :src="profilePicture" alt="avatar" @error="handleImageError" />
          <span class="profile-status"></span>
        </div>
        <template v-if="!collapsed">
          <div class="profile-details" @click="navigate('/profile')">
            <span class="profile-name">{{ userName }}</span>
            <span class="profile-role">{{ userRole }}</span>
          </div>
          <button class="logout-btn" title="Sign out" @click="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </template>
      </div>
    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  width: 270px;
  flex-shrink: 0;
  height: 100vh;
  background: #022B54;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  position: sticky;
  top: 0;
  z-index: 200;
  box-shadow: 4px 0 24px rgba(0,0,0,0.3);
  transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease;
}

.sidebar-light {
  background: #03396C;
  box-shadow: 4px 0 20px rgba(84,18,22,0.25);
}
.sidebar-collapsed { width: 72px; }
.sidebar::-webkit-scrollbar { display: none; }

/* ── Top accent stripe ── */
.sidebar-accent {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #FE9312 0%, #03396C 50%, #366497 100%);
  background-size: 200% 100%;
  animation: accentShimmer 5s linear infinite;
}
@keyframes accentShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Brand row ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 100%);
  flex-shrink: 0;
  min-height: 68px;
}
.sidebar-collapsed .sidebar-brand {
  padding: 0.85rem 0;
  justify-content: center;
  gap: 0;
}

.brand-mark {
  width: 2.5rem; height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(254, 147, 18, 0.6);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  padding: 3px;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s;
}
.brand-mark:hover {
  transform: scale(1.06);
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3), 0 0 16px rgba(254, 147, 18, 0.5);
}
.brand-logo-img {
  width: 100%; height: 100%;
  object-fit: contain;
}

/* Collapsed Single Centered Logo Mark */
.brand-collapsed-mark {
  position: relative;
  width: 2.5rem; height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(254, 147, 18, 0.6);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  display: flex; align-items: center; justify-content: center;
  padding: 3px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.brand-collapsed-mark:hover {
  transform: scale(1.08);
  border-color: #FE9312;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35), 0 0 18px rgba(254, 147, 18, 0.6);
}
.brand-expand-overlay {
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  background: rgba(3, 57, 108, 0.92);
  color: #FE9312;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.brand-collapsed-mark:hover .brand-expand-overlay {
  opacity: 1;
}
.expand-icon { width: 1.1rem; height: 1.1rem; }

.brand-text {
  flex: 1;
  display: flex; flex-direction: column;
  justify-content: center;
  line-height: 1.25; min-width: 0;
  cursor: pointer;
  overflow: hidden;
}
.brand-name {
  font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
  font-size: 0.85rem; font-weight: 800;
  color: #ffffff;
  white-space: nowrap; letter-spacing: -0.01em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.brand-sub {
  font-size: 0.625rem; font-weight: 800;
  color: #FE9312;
  text-transform: uppercase; letter-spacing: 0.16em;
  white-space: nowrap; margin-top: 0.1rem;
}

/* Collapse toggle button */
.collapse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-left: auto;
}
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-color: rgba(254, 147, 18, 0.5);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}
.collapse-icon {
  width: 0.95rem; height: 0.95rem;
  transition: transform 0.25s ease;
}

/* ── Section label ── */
.sidebar-section-label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.65rem; font-weight: 700;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase; letter-spacing: 0.14em;
  padding: 1rem 1.25rem 0.4rem;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

/* ── Nav ── */
.sidebar-nav {
  padding: 0.75rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
}
.sidebar-collapsed .sidebar-nav {
  padding: 0.75rem 0;
  align-items: center;
}
.nav-group { display: flex; flex-direction: column; width: 100%; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255,255,255,0.85);
  font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  width: 100%;
  position: relative;
  white-space: nowrap;
  box-sizing: border-box;
}
.sidebar-collapsed .nav-item {
  width: 44px; height: 44px;
  margin: 0 auto;
  padding: 0;
  justify-content: center;
  gap: 0;
  border-radius: 12px;
}
.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #ffffff;
  transform: translateX(2px);
}
.sidebar-collapsed .nav-item:hover {
  transform: translateY(-1px) scale(1.05);
  background: rgba(255,255,255,0.12);
}
.nav-item-active {
  background: rgba(255,255,255,0.14) !important;
  color: #ffffff !important;
  border-color: rgba(254, 147, 18, 0.4) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15), 0 0 12px rgba(254, 147, 18, 0.2) !important;
  font-weight: 700;
}
.sidebar-collapsed .nav-item-active {
  background: rgba(255,255,255,0.18) !important;
  border: 1.5px solid rgba(254, 147, 18, 0.7) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 0 16px rgba(254, 147, 18, 0.4) !important;
  transform: none;
}
.nav-item-open { background: rgba(255,255,255,0.07); color: #ffffff; }

.nav-item-icon {
  display: flex; align-items: center; justify-content: center;
  width: 1.35rem; height: 1.35rem;
  flex-shrink: 0; color: inherit;
  transition: transform 0.2s ease;
}
.nav-item:hover .nav-item-icon { transform: scale(1.08); }
.nav-item-icon :deep(svg) { width: 1.35rem; height: 1.35rem; }
.nav-item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

.nav-chevron {
  width: 1rem; height: 1rem;
  flex-shrink: 0;
  color: rgba(255,255,255,0.6);
  transition: transform 0.22s ease, color 0.15s;
  display: block !important;
}
.nav-chevron-open { transform: rotate(180deg); color: #FE9312; }

/* ── Sub-items ── */
.nav-sub {
  display: flex; flex-direction: column;
  padding: 0.25rem 0 0.25rem 0.75rem;
  gap: 0.2rem;
  overflow: hidden;
}
.nav-sub-item {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255,255,255,0.75);
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem; font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left; width: 100%;
  white-space: nowrap;
}
.nav-sub-item:hover {
  background: rgba(255,255,255,0.08);
  color: #ffffff;
  transform: translateX(2px);
}
.nav-sub-item-active {
  color: #ffffff !important;
  background: rgba(254, 147, 18, 0.18) !important;
  border-color: rgba(254, 147, 18, 0.4) !important;
  font-weight: 700;
}
.nav-sub-icon {
  display: flex; align-items: center; justify-content: center;
  width: 1rem; height: 1rem; flex-shrink: 0; color: inherit;
}
.nav-sub-icon :deep(svg) { width: 1rem; height: 1rem; }
.nav-sub-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

/* ── Sub-expand transition ── */
.sub-expand-enter-active, .sub-expand-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 800px;
}
.sub-expand-enter-from, .sub-expand-leave-to { max-height: 0; opacity: 0; }

/* ── Spacer ── */
.sidebar-spacer { flex: 1; min-height: 1rem; }

/* ── Profile card ── */
.sidebar-profile {
  padding: 0.6rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.2s ease;
  cursor: default;
}
.profile-card-collapsed {
  width: 44px; height: 44px;
  margin: 0 auto;
  padding: 0;
  justify-content: center;
  gap: 0;
  border-radius: 12px;
}
.profile-card:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.15);
}

.profile-avatar {
  position: relative;
  width: 2.25rem; height: 2.25rem;
  border-radius: 50%; overflow: hidden; flex-shrink: 0;
  border: 2px solid rgba(254, 147, 18,0.6);
  cursor: pointer;
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.profile-status {
  position: absolute; bottom: 1px; right: 1px;
  width: 0.5rem; height: 0.5rem; border-radius: 50%;
  background: #10B981;
  border: 2px solid #022B54;
}

.profile-details { flex: 1; min-width: 0; display: flex; flex-direction: column; cursor: pointer; }
.profile-name {
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem; font-weight: 700;
  color: #ffffff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.profile-role {
  font-family: 'Outfit', sans-serif;
  font-size: 0.65rem; font-weight: 600;
  color: #FE9312;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-top: 0.1rem;
}

.logout-btn {
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem;
  border-radius: 0.4rem; border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;
}
.logout-btn svg { width: 1rem; height: 1rem; }
.logout-btn:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
</style>
