<script setup>
import { useAuthStore } from "@/stores/auth";
import { ref, computed } from "vue";
import imageSrc from "@/assets/img/profile.png";
import { useRouter } from "vue-router";

const props = defineProps({
  breadcrumbs: Object,
  navs: { type: Array, default: () => [] },
});

const router    = useRouter();
const authStore = useAuthStore();

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
  <aside class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">

    <!-- Top accent stripe -->
    <div class="sidebar-accent"></div>

    <!-- Brand + collapse toggle -->
    <div class="sidebar-brand">
      <div class="brand-mark" @click="navigate('/module-select')" title="Switch module">
        <img src="/src/assets/img/logo.png" alt="EIC" class="brand-logo-img" />
      </div>
      <Transition name="fade-text">
        <div v-if="!collapsed" class="brand-text" @click="navigate('/module-select')">
          <span class="brand-name">Ethiopian Insurance Corporation</span>
          <span class="brand-sub">HealthConnect</span>
        </div>
      </Transition>
      <button class="collapse-btn" @click="toggleCollapse" :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="collapse-icon" :class="{ 'collapse-icon-flipped': collapsed }">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>

    <!-- Section label -->
    <!-- <div v-if="!collapsed" class="sidebar-section-label">Navigation</div> -->

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
/* ══ SIDEBAR — hardcoded hex (wind.css overrides CSS vars with RGB tuples) ══ */

.sidebar {
  width: 280px;
  flex-shrink: 0;
  height: 100vh;
  background: #00224D;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  position: sticky;
  top: 0;
  z-index: 200;
  box-shadow: 4px 0 24px rgba(0,0,0,0.3);
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
}
.sidebar-collapsed { width: 68px; }
.sidebar::-webkit-scrollbar { display: none; }

/* ── Top accent stripe ── */
.sidebar-accent {
  height: 3px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #F39200 0%, #003E7E 50%, #1A5A9A 100%);
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
  padding: 1rem 0.875rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  min-height: 64px;
}
.sidebar-collapsed .sidebar-brand {
  padding: 1rem 0;
  justify-content: center;
  gap: 0;
}

.brand-mark {
  width: 2.25rem; height: 2.25rem;
  border-radius: 0.625rem;
  background: rgba(243,146,0,0.2);
  border: 1px solid rgba(243,146,0,0.45);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.15s;
}
.brand-mark:hover { background: rgba(243,146,0,0.3); }
.brand-logo-img {
  width: 2.25rem; height: 2.25rem;
  object-fit: contain;
}

.brand-text {
  flex: 1;
  display: flex; flex-direction: column;
  line-height: 1.2; min-width: 0;
  cursor: pointer;
  overflow: hidden;
}
.brand-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem; font-weight: 800;
  color: #ffffff;
  white-space: nowrap; letter-spacing: -0.01em;
}
.brand-sub {
  font-size: 0.625rem; font-weight: 700;
  color: #F39200;
  text-transform: uppercase; letter-spacing: 0.15em;
  white-space: nowrap;
}

/* Collapse toggle button */
.collapse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem;
  border-radius: 0.4rem; border: none;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
  margin-left: auto;
}
.sidebar-collapsed .collapse-btn { margin-left: 0; margin-top: 0.25rem; }
.collapse-btn:hover { background: rgba(255,255,255,0.12); color: #ffffff; }
.collapse-icon {
  width: 0.9rem; height: 0.9rem;
  transition: transform 0.25s ease;
}
.collapse-icon-flipped { transform: rotate(180deg); }

/* Fade-text transition */
.fade-text-enter-active { transition: opacity 0.15s ease 0.1s, transform 0.15s ease 0.1s; }
.fade-text-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.fade-text-enter-from, .fade-text-leave-to { opacity: 0; transform: translateX(-6px); }

/* ── Section label ── */
.sidebar-section-label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.65rem; font-weight: 700;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase; letter-spacing: 0.14em;
  padding: 1.25rem 1.5rem 0.5rem;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

/* ── Nav ── */
.sidebar-nav {
  padding: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
}
.nav-group { display: flex; flex-direction: column; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.8rem 1.5rem;
  border-radius: 0;
  border: none;
  border-left: 4px solid transparent;
  background: transparent;
  color: rgba(255,255,255,0.85);
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  text-align: left;
  width: 100%;
  position: relative;
  white-space: nowrap;
}
.sidebar-collapsed .nav-item {
  padding: 0.8rem 0;
  justify-content: center;
  gap: 0;
  border-left: 4px solid transparent;
}
.nav-item:hover { background: rgba(255,255,255,0.1); color: #ffffff; }
.nav-item-active {
  background: rgba(255,255,255,0.1) !important;
  color: #ffffff !important;
  border-left-color: #F39200 !important;
  font-weight: 600;
}
.nav-item-open { background: rgba(255,255,255,0.07); color: #ffffff; }

.nav-item-icon {
  display: flex; align-items: center; justify-content: center;
  width: 1.25rem; height: 1.25rem;
  flex-shrink: 0; color: inherit;
}
.nav-item-icon :deep(svg) { width: 1.25rem; height: 1.25rem; }
.nav-item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

.nav-chevron {
  width: 1rem; height: 1rem;
  flex-shrink: 0;
  color: rgba(255,255,255,0.7);
  transition: transform 0.22s ease, color 0.15s;
  display: block !important;
}
.nav-chevron-open { transform: rotate(180deg); color: #F39200; }

/* ── Sub-items ── */
.nav-sub {
  display: flex; flex-direction: column;
  padding: 0.2rem 0;
  overflow: hidden;
  background: rgba(0,0,0,0.12);
}
.nav-sub-item {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.65rem 1.5rem 0.65rem 2.875rem;
  border-radius: 0; border: none;
  border-left: 4px solid transparent;
  background: transparent;
  color: rgba(255,255,255,0.75);
  font-family: 'Outfit', sans-serif;
  font-size: 0.875rem; font-weight: 400;
  cursor: pointer;
  transition: background 0.13s, color 0.13s;
  text-align: left; width: 100%;
  white-space: nowrap;
}
.nav-sub-item:hover { background: rgba(255,255,255,0.08); color: #ffffff; }
.nav-sub-item-active {
  color: #ffffff !important;
  background: rgba(255,255,255,0.1) !important;
  border-left-color: #F39200 !important;
  font-weight: 600;
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
  padding: 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
}
.profile-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255,255,255,0.06);
  border: none;
  transition: background 0.15s;
  cursor: default;
}
.profile-card-collapsed {
  justify-content: center;
  padding: 0.875rem 0;
  gap: 0;
}
.profile-card:hover { background: rgba(255,255,255,0.1); }

.profile-avatar {
  position: relative;
  width: 2.25rem; height: 2.25rem;
  border-radius: 50%; overflow: hidden; flex-shrink: 0;
  border: 2px solid rgba(243,146,0,0.6);
  cursor: pointer;
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.profile-status {
  position: absolute; bottom: 1px; right: 1px;
  width: 0.5rem; height: 0.5rem; border-radius: 50%;
  background: #10B981;
  border: 2px solid #00224D;
}

.profile-details { flex: 1; min-width: 0; display: flex; flex-direction: column; cursor: pointer; }
.profile-name {
  font-family: 'Outfit', sans-serif;
  font-size: 0.875rem; font-weight: 700;
  color: #ffffff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.profile-role {
  font-family: 'Outfit', sans-serif;
  font-size: 0.68rem; font-weight: 600;
  color: #F39200;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-top: 0.1rem;
}

.logout-btn {
  display: flex; align-items: center; justify-content: center;
  width: 1.75rem; height: 1.75rem;
  border-radius: 0.4rem; border: none;
  background: transparent;
  color: rgba(255,255,255,0.35);
  cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;
}
.logout-btn svg { width: 1rem; height: 1rem; }
.logout-btn:hover { background: rgba(239,68,68,0.18); color: #fca5a5; }
</style>
