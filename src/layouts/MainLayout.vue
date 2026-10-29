<script setup>
import NavBar from "@/components/NavBar.vue";
import { hasFullSystemAccess, hasRoleAccess, navItemArea } from "@/utils/roleAccess";
import { prefetchRoutesIdle } from "@/router/prefetch";
import NotificationCenter from "@/components/NotificationCenter.vue";
import { useAuthStore } from "@/stores/auth";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useColorStore } from "@/stores/colorStore";
import { useModuleStore } from "@/stores/moduleStore";
import healthNavs from "@/features/health/navs";
import motorNavs from "@/features/motor/navs.js";
import fireNavs from "@/features/fire/navs.js";
import marineNavs, { filterMarineNavs } from "@/features/marine/navs.js";
import { useMarineRoles } from "@/features/marine/composables/useCan";
import lifeNavs from "@/features/life/navs.js";
import engineeringNavs from "@/features/engineering/navs.js";
import liabilityNavs from "@/features/liability/navs.js";
import burglaryNavs from "@/features/burglary/navs.js";
import imageSrc from "@/assets/img/profile.png";

import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// Only shown on /home, so keep it out of the shell bundle
const HomeScreen = defineAsyncComponent(() => import("@/components/HomeScreen.vue"));

const authStore = useAuthStore();
const moduleStore = useModuleStore();
const breadcrumbs = useBreadcrumb();
const colorStore = useColorStore();
const route = useRoute();
const router = useRouter();

// ── Top bar user info ──
const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const userName = computed(() =>
  [u.value?.firstName, u.value?.fatherName].filter(Boolean).join(" ") || "User"
);
const userRole = computed(() => u.value?.roleName || "Admin");
const userInitials = computed(() =>
  userName.value.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
);
const profilePicture = computed(() => {
  const data = authStore.imageData || u.value?.imageData || u.value?.image || null;
  if (!data) return imageSrc;
  if (typeof data === "string" && data.startsWith("data:image/")) return data;
  return `data:image/png;base64,${data}`;
});
function handleImgError(e) { e.target.src = imageSrc; }
function logout() { authStore.logout(); }

const isSuperAdmin = computed(() => {
  const user = authStore.auth?.user ?? authStore.auth ?? {};
  return hasFullSystemAccess(user);
});

// ── Current page title from breadcrumbs or route ──
const pageTitle = computed(() => {
  if (breadcrumbs?.current?.value) return breadcrumbs.current.value;
  // Detail pages end in an id, so prefer a title declared on the route
  if (route.meta?.title) return route.meta.title;
  const seg = route.path.split("/").filter(Boolean).pop() || "Dashboard";
  return seg.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
});

const MODULE_NAVS = {
  health:      healthNavs,
  motor:       motorNavs,
  fire:        fireNavs,
  marine:      marineNavs,
  life:        lifeNavs,
  engineering: engineeringNavs,
  liability:   liabilityNavs,
  burglary:    burglaryNavs,
};

// ── Active module raw navs ──
const marineRoles = useMarineRoles();
const activeNavs = computed(() => {
  const id = moduleStore.activeModuleId;
  // Marine items carry their own role lists (Marine roles, not the AuthService role names)
  if (id === "marine") return filterMarineNavs(marineNavs, marineRoles.value);
  return MODULE_NAVS[id] || healthNavs;
});

// ── Role-filtered navigation items for all modules (same rules the router enforces) ──
const filteredNavs = computed(() => {
  // Marine items are already filtered by Marine role in activeNavs
  if (moduleStore.activeModuleId === "marine") return activeNavs.value || [];
  const user = authStore.auth?.user ?? authStore.auth ?? {};
  return (activeNavs.value || []).filter(item => {
    const area = navItemArea(item.name || '');
    return !area || hasRoleAccess(user, area);
  });
});

// Once the shell is idle, fetch the pages in this module's sidebar so clicking a nav item is instant
watch(filteredNavs, (navs) => prefetchRoutesIdle(router, navs), { immediate: true });

// Show HomeScreen launcher on /home
const isHomePage = computed(() => route.path === "/home");

// Module-select page — renders ModuleLauncher directly via RouterView, no NavBar wrapper needed
const isModuleSelect = computed(() => route.path === "/module-select");
</script>

<template>
  <div :class="colorStore.color" class="layout-root">

    <!-- ══ MODULE SELECT: full-screen, no navbar ══ -->
    <template v-if="isModuleSelect">
      <div class="module-select-shell">
        <Transition name="page-fade" mode="out-in">
          <RouterView :key="route.path" />
        </Transition>
      </div>
    </template>

    <!-- ══ NORMAL APP SHELL: sidebar + content column ══ -->
    <template v-else>
      <!-- LEFT SIDEBAR -->
      <NavBar :breadcrumbs="breadcrumbs" :navs="filteredNavs" />

      <!-- RIGHT COLUMN: topbar + page content -->
      <div class="content-column">

        <!-- TOP BAR -->
        <header class="topbar">
          <div class="topbar-left">
            <h2 class="topbar-title">{{ pageTitle }}</h2>
          </div>
          <div class="topbar-right">

            <!-- Real Functional Notification Center -->
            <NotificationCenter />

            <!-- User & Roles Access Settings (Super Admin Only) -->
            <button v-if="isSuperAdmin" @click="router.push('/admin/user-roles')" class="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer ml-1" title="Manage System Users & Privileges">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <span>User & Roles</span>
            </button>

            <div class="tb-divider"></div>

            <!-- User profile -->
            <div class="tb-profile" @click="router.push('/profile')" title="My Profile">
              <div class="tb-avatar">
                <img :src="profilePicture" alt="avatar" @error="handleImgError" />
              </div>
              <div class="tb-user-info">
                <span class="tb-user-name">{{ userName }}</span>
                <span class="tb-user-role">{{ userRole }}</span>
              </div>
            </div>

            <div class="tb-divider"></div>

            <!-- Logout -->
            <button class="tb-logout-btn" title="Sign out" @click="logout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span>Logout</span>
            </button>

          </div>
        </header>

        <!-- PAGE CONTENT -->
        <main class="content-area">
          <Transition name="page-fade" mode="out-in">
            <HomeScreen v-if="isHomePage" :navs="filteredNavs" :key="'home'" />
            <div v-else class="page-wrapper" :key="route.path">
              <RouterView />
            </div>
          </Transition>
        </main>

      </div>
    </template>

  </div>
</template>

<style scoped>
/* ── Root shell ── */
.layout-root {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  background: rgb(var(--canvas));
  overflow: hidden;
}

/* ── Right column (topbar + scrollable content) ── */
.content-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Top bar ── */
.topbar {
  height: 64px;
  flex-shrink: 0;
  background: rgb(var(--surface));
  border-bottom: 1px solid rgb(var(--line));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.topbar-left {}
.topbar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--ink));
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.01em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Notification button */
.tb-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--line));
  background: rgb(var(--surface-muted));
  color: rgb(var(--ink-muted));
  cursor: pointer;
  transition: all 0.15s;
}
.tb-icon-btn svg { width: 1.1rem; height: 1.1rem; }
.tb-icon-btn:hover { background: rgb(var(--surface-raised)); color: rgb(var(--ink)); border-color: rgb(var(--line-strong)); }
.tb-notif-dot {
  position: absolute;
  top: 0.35rem; right: 0.35rem;
  width: 0.45rem; height: 0.45rem;
  border-radius: 50%;
  background: #FE9312;
  border: 1.5px solid rgb(var(--surface));
}

/* Divider */
.tb-divider {
  width: 1px;
  height: 1.75rem;
  background: rgb(var(--line));
  margin: 0 0.25rem;
}

/* User profile chip */
.tb-profile {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  border-radius: 2rem;
  border: 1px solid rgb(var(--line));
  background: rgb(var(--surface-muted));
  cursor: pointer;
  transition: all 0.15s;
}
.tb-profile:hover { background: rgb(var(--surface-raised)); border-color: rgb(var(--line-strong)); }
.tb-avatar {
  width: 2rem; height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgb(var(--primary-fg));
  flex-shrink: 0;
}
.tb-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tb-user-info { display: flex; flex-direction: column; line-height: 1.2; }
.tb-user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgb(var(--ink));
  white-space: nowrap;
}
.tb-user-role {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgb(var(--primary-fg));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Logout button */
.tb-logout-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--error) / 0.35);
  background: rgb(var(--error-soft));
  color: rgb(var(--error));
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.tb-logout-btn svg { width: 1rem; height: 1rem; }
.tb-logout-btn:hover { background: rgb(var(--error-soft)); border-color: rgb(var(--error) / 0.5); }

/* ── Scrollable page content ── */
.content-area {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: rgb(var(--canvas));
  box-sizing: border-box;
}

.page-wrapper {
  padding: 1.25rem 1.5rem;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Full-width shell for module-select (no sidebar) */
.module-select-shell {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Page transition */
/* out-in waits for the leave, so leave instantly and only animate the incoming page */
.page-fade-enter-active { transition: opacity 0.14s ease-out, transform 0.14s ease-out; }
.page-fade-leave-active { transition: none; }
.page-fade-enter-from   { opacity: 0; transform: translateY(4px); }
.page-fade-leave-to     { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active { transition: none; }
}
</style>
