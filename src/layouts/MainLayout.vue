<script setup>
import NavBar from "@/components/NavBar.vue";
import HomeScreen from "@/components/HomeScreen.vue";
import { useAuthStore } from "@/stores/auth";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useColorStore } from "@/stores/colorStore";
import { useModuleStore } from "@/stores/moduleStore";
import healthNavs from "@/config/navs";
import motorNavs from "@/config/module-navs/motor.navs.js";
import fireNavs from "@/config/module-navs/fire.navs.js";
import marineNavs from "@/config/module-navs/marine.navs.js";
import lifeNavs from "@/config/module-navs/life.navs.js";
import engineeringNavs from "@/config/module-navs/engineering.navs.js";
import liabilityNavs from "@/config/module-navs/liability.navs.js";
import burglaryNavs from "@/config/module-navs/burglary.navs.js";
import imageSrc from "@/assets/img/profile.png";

import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

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

// ── Current page title from breadcrumbs or route ──
const pageTitle = computed(() => {
  if (breadcrumbs?.current?.value) return breadcrumbs.current.value;
  const seg = route.path.split("/").filter(Boolean).pop() || "Dashboard";
  return seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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
const activeNavs = computed(() => {
  const id = moduleStore.activeModuleId;
  return MODULE_NAVS[id] || healthNavs;
});

// ── Privilege-filtered navs (health module goes through permission filter) ──
const filteredNavs = computed(() => {
  const id = moduleStore.activeModuleId;

  // Non-health modules use their own nav configs without privilege filtering
  if (id && id !== 'health') {
    return activeNavs.value;
  }

  // Health module: filter by user privileges
  const user = authStore.auth?.user ?? authStore.auth;
  const roleName = user?.roleName;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  const rolePrivileges = Array.isArray(user?.role?.privilegeList) ? user.role.privilegeList : [];
  const authorities = Array.isArray(user?.authorities) ? user.authorities : [];
  
  const effectivePrivileges = [...privileges, ...rolePrivileges, ...authorities]
    .filter(Boolean)
    .map((p) => String(p).trim());

  const hasPrivilege = (privilege) => {
    if (roleName === "Super Admin" || effectivePrivileges.includes("All Privileges") || effectivePrivileges.includes("ROLE_All Privileges")) {
      return true;
    }
    return effectivePrivileges.includes(`ROLE_${privilege}`) || 
           effectivePrivileges.includes(privilege);
  };

  const hasManagesQuotation = hasPrivilege("Manages_Quotation");

  const getRequiredPrivileges = (navItem) => {
    if (navItem?.meta?.permissions && Array.isArray(navItem.meta.permissions)) {
      return navItem.meta.permissions;
    }
    if (Array.isArray(navItem?.privilege)) {
      return navItem.privilege;
    }
    return [];
  };

  const hasAccess = (navItem) => {
    const requiredPrivs = getRequiredPrivileges(navItem);
    if (requiredPrivs.length === 0) return true;
    if (roleName === "Super Admin" || effectivePrivileges.includes("All Privileges") || effectivePrivileges.includes("ROLE_All Privileges")) {
      return true;
    }
    return requiredPrivs.some((p) => hasPrivilege(p));
  };

  return healthNavs
    .map((item) => {
      const isUnderwriting = item.name === "Underwriting";
      const isQuotationRelated = item.name === "Quotation" || item.name === "Quotation Underwriting";

      if (isUnderwriting) {
        if (hasManagesQuotation) return null;
      }
      if (isQuotationRelated) {
        if (!hasManagesQuotation) return null;
      }

      if (item.navs) {
        const children = item.navs.filter((c) => {
          if (item.name === "Quotation Underwriting") {
            return true;
          }
          return hasAccess(c);
        });
        return children.length ? { ...item, navs: children } : null;
      }
      return hasAccess(item) ? item : null;
    })
    .filter(Boolean);
});

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

            <!-- Notifications -->
            <button class="tb-icon-btn" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span class="tb-notif-dot"></span>
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
  background: #F8FAFC;
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
  background: #ffffff;
  border-bottom: 1px solid #E2E8F0;
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
  color: #0F172A;
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
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s;
}
.tb-icon-btn svg { width: 1.1rem; height: 1.1rem; }
.tb-icon-btn:hover { background: #F1F5F9; color: #0F172A; border-color: #CBD5E1; }
.tb-notif-dot {
  position: absolute;
  top: 0.35rem; right: 0.35rem;
  width: 0.45rem; height: 0.45rem;
  border-radius: 50%;
  background: #F39200;
  border: 1.5px solid #ffffff;
}

/* Divider */
.tb-divider {
  width: 1px;
  height: 1.75rem;
  background: #E2E8F0;
  margin: 0 0.25rem;
}

/* User profile chip */
.tb-profile {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  border-radius: 2rem;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  cursor: pointer;
  transition: all 0.15s;
}
.tb-profile:hover { background: #F1F5F9; border-color: #CBD5E1; }
.tb-avatar {
  width: 2rem; height: 2rem;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #F39200;
  flex-shrink: 0;
}
.tb-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tb-user-info { display: flex; flex-direction: column; line-height: 1.2; }
.tb-user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0F172A;
  white-space: nowrap;
}
.tb-user-role {
  font-size: 0.65rem;
  font-weight: 600;
  color: #F39200;
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
  border: 1px solid #FECACA;
  background: #FFF5F5;
  color: #EF4444;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.tb-logout-btn svg { width: 1rem; height: 1rem; }
.tb-logout-btn:hover { background: #FEE2E2; border-color: #FCA5A5; }

/* ── Scrollable page content ── */
.content-area {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: #F8FAFC;
}

.page-wrapper {
  padding: 1.5rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* Full-width shell for module-select (no sidebar) */
.module-select-shell {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.page-fade-enter-from   { opacity: 0; transform: translateX(8px); }
.page-fade-leave-to     { opacity: 0; transform: translateX(-4px); }
</style>
