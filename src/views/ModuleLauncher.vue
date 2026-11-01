<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useModuleStore, MODULES, ADMIN_MODULE_ID, CATALOGUE_ICON } from '@/stores/moduleStore';
import { useAuthStore } from '@/stores/auth';
import { useLanguageStore } from '@/stores/languageStore';
import { canOpenUserManagement, isExactSuperAdmin } from '@/utils/roleAccess';
import LauncherProducts from './launcher/LauncherProducts.vue';
import LauncherSkeleton from './launcher/LauncherSkeleton.vue';
import LauncherStats from './launcher/LauncherStats.vue';
import { computed, onMounted, ref } from 'vue';
import imageSrc from '@/assets/img/profile.png';
import eicLogo from '@/assets/img/standard_icon.png';

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const authStore = useAuthStore();
const langStore = useLanguageStore();

const u = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const userName = computed(() =>
  [u.value?.firstName, u.value?.fatherName].filter(Boolean).join(' ') || 'Admin'
);
const userRole = computed(() => u.value?.roleName || 'SUPER ADMIN');
const profilePicture = computed(() => {
  const data = authStore.imageData || u.value?.imageData || u.value?.image || null;
  if (!data) return imageSrc;
  if (typeof data === 'string' && data.startsWith('data:image/')) return data;
  return `data:image/png;base64,${data}`;
});

const showUserMenu = ref(false);

// Tiles come from GET /modules/me (ordered by sortOrder). Only when the server has no module
// registry yet (404) do we fall back to the built-in list, and say so on the page.
const registryUnavailable = computed(() => moduleStore.registryStatus === 'unavailable');
const loadingModules = computed(() => moduleStore.registryStatus === 'loading' && !moduleStore.registry.length);
const registryFailed = computed(() => moduleStore.registryStatus === 'error');

const adminTile = computed(() => MODULES.find((mod) => mod.id === ADMIN_MODULE_ID));
const catalogueTile = {
  id: 'catalogue',
  name: 'Product catalogue',
  description: 'Create insurance products, then define their proposal form, covers and pricing — no release needed.',
  icon: CATALOGUE_ICON,
  badge: 'Products',
  dashboardPath: '/product-catalogue',
  sidebarId: ADMIN_MODULE_ID,
  kind: 'tool',
};

const visibleModules = computed(() => {
  if (registryUnavailable.value) {
    return MODULES.filter((mod) => !mod.superAdminOnly || canOpenUserManagement(u.value));
  }
  const tiles = [...moduleStore.launcherModules];
  if (moduleStore.isSuperAdmin() || moduleStore.canAnywhere('.product.read')) tiles.push(catalogueTile);
  if (canOpenUserManagement(u.value) && adminTile.value) tiles.push({ ...adminTile.value, kind: 'tool' });
  return tiles;
});

function tileTitle(mod) {
  // Registry names are editable, so they win; Amharic keeps its translation for coded modules
  if (langStore.isAmharic) return langStore.t('modules.' + mod.id, {}, mod.name);
  return mod.name || langStore.t('modules.' + mod.id);
}

function tileDescription(mod) {
  if (langStore.isAmharic) return langStore.t('modules.' + mod.id + 'Desc', {}, mod.description);
  return mod.description || langStore.t('modules.' + mod.id + 'Desc', {}, '');
}

function reload() {
  moduleStore.loadRegistry({ force: true });
}

/* ── Dashboard / Reports / Products views, kept in the URL so Back returns to the same tab ── */
const VIEWS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  },
  {
    id: 'products',
    label: 'Products',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  },
];
const VIEW_INTROS = {
  dashboard: 'Your business at a glance: claims across every product, and quick access to your modules.',
  reports: 'Open the reports and analytics your role gives you access to.',
  products: 'Browse our Life and Non-Life products and start a quotation in one click.',
};
const activeView = computed(() => (VIEWS.some((v) => v.id === route.query.view) ? route.query.view : 'dashboard'));

function setView(view) {
  router.replace({ query: { ...route.query, view: view === 'dashboard' ? undefined : view } });
}

/* ── Reports: the same privileges the report routes require (any one grants access) ── */
const REPORTS = [
  {
    id: 'analytics',
    name: 'Analytics dashboard',
    description: 'Claims and policy trends, with charts across your book of business.',
    path: '/analytics',
    moduleId: 'health',
    permissions: ['Read_claims', 'Read_policies'],
  },
  {
    id: 'utilization',
    name: 'Utilization report',
    description: 'Provider credit and service utilization.',
    path: '/reports/provider-report',
    moduleId: 'health',
    permissions: ['Analytics'],
  },
  {
    id: 'report-center',
    name: 'Report center',
    description: 'Build and filter dynamic reports.',
    path: '/reports/dynamic-report',
    moduleId: 'health',
    permissions: ['Analytics'],
  },
];

function hasAnyPrivilege(permissions) {
  const user = u.value;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  if (isExactSuperAdmin(user) || privileges.includes('All Privileges') || privileges.includes('ROLE_All Privileges')) return true;
  return permissions.some((p) => privileges.includes(`ROLE_${p}`));
}

const visibleReports = computed(() => REPORTS.filter((report) => hasAnyPrivilege(report.permissions)));

function openReport(report) {
  moduleStore.selectModule(report.moduleId);
  router.push(report.path);
}

onMounted(async () => {
  // Refetch on every return to the launcher so role changes show up
  await moduleStore.loadRegistry({ force: true });
  if (moduleStore.launcherModules.some((mod) => mod.kind === 'product')) moduleStore.loadDefinitions({ force: true });
});

function selectModule(mod) {
  moduleStore.selectModule(mod.sidebarId || mod.id);
  router.push(mod.dashboardPath);
}

function logout() { showUserMenu.value = false; authStore.logout(); }
function goProfile() { showUserMenu.value = false; router.push('/profile'); }
</script>

<template>
  <div class="min-h-screen bg-surface-muted/60 text-ink font-sans flex flex-col">
    
    <!-- Top Navigation Bar -->
    <header class="bg-white border-b border-line/80 px-8 py-3.5 shadow-2xs sticky top-0 z-30">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        <!-- Left: Brand Logo -->
        <div class="flex items-center gap-3 shrink-0">
          <img :src="eicLogo" alt="Standard Insurance S.C." class="h-9 w-auto object-contain shrink-0" />
          <div class="flex flex-col text-left justify-center items-start shrink-0">
            <h1 class="text-sm font-extrabold text-ink leading-none whitespace-nowrap">Standard Insurance S.C.</h1>
            <p class="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mt-1 leading-none whitespace-nowrap pl-[7px]">YOUR TRUST, OUR STANDARD</p>
          </div>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-3">
          
          <!-- Language Switcher -->
          <button 
            @click.stop="langStore.toggleLanguage()"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-raised hover:bg-line text-ink-muted transition-colors border border-line/80"
          >
            {{ langStore.isAmharic ? 'English' : 'አማርኛ' }}
          </button>

          <!-- User Profile Chip -->
          <div class="relative">
            <button 
              @click.stop="showUserMenu = !showUserMenu"
              class="flex items-center gap-2.5 px-3 py-1 rounded-full bg-surface-raised hover:bg-line border border-line/80 transition-colors"
            >
              <img :src="profilePicture" class="w-6 h-6 rounded-full object-cover border-2 border-amber-500" />
              <div class="text-left leading-tight hidden sm:block">
                <span class="text-xs font-bold text-ink block">{{ userName }}</span>
                <span class="text-[9px] font-bold text-amber-600 uppercase">{{ userRole }}</span>
              </div>
            </button>

            <!-- Dropdown Menu -->
            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-line py-2 z-50">
              <div class="px-4 py-2 border-b border-line">
                <p class="text-xs font-bold text-ink">{{ userName }}</p>
                <p class="text-[10px] text-ink-subtle font-medium">{{ userRole }}</p>
              </div>
              <button @click="goProfile" class="w-full text-left px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted">
                My Profile
              </button>
              <button @click="logout" class="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                Logout
              </button>
            </div>
          </div>

          <!-- Red Logout Button -->
          <button 
            @click="logout" 
            class="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors hidden sm:flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="max-w-7xl w-full mx-auto px-8 py-6 flex-1">
      
      <!-- Welcome bar with the Dashboard / Reports / Products switch. It stays one slim row; the tagline
           and a line about the chosen section open over the page below it on hover or keyboard focus. -->
      <section class="relative mb-5 h-14" aria-label="Welcome">
        <div class="welcome absolute inset-x-0 top-0 z-20 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-primary-sm">
          <span class="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/[0.06]"></span>
          <span class="pointer-events-none absolute right-40 -bottom-20 h-32 w-32 rounded-full bg-amber-400/10"></span>

          <div class="relative flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
            <div class="flex min-w-0 items-center gap-3">
              <span class="h-6 w-1 shrink-0 rounded-full bg-amber-400"></span>
              <h2 class="truncate text-base font-black leading-none tracking-tight sm:text-lg">Welcome, {{ userName }}</h2>
              <svg class="welcome-hint hidden h-4 w-4 shrink-0 text-white/50 sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <nav class="inline-flex shrink-0 rounded-xl bg-white/10 p-0.5 ring-1 ring-white/15" role="tablist" aria-label="Launcher sections">
              <button
                v-for="view in VIEWS"
                :key="view.id"
                type="button"
                role="tab"
                :aria-selected="activeView === view.id"
                :title="view.label"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-[0.6rem] px-2.5 py-1.5 text-xs font-bold transition-all duration-200 sm:px-3.5 [&>span>svg]:h-4 [&>span>svg]:w-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                  activeView === view.id ? 'bg-white text-primary shadow-soft' : 'text-white/80 hover:bg-white/10 hover:text-white',
                ]"
                @click="setView(view.id)"
              >
                <span class="inline-flex" v-html="view.icon"></span>
                <span class="hidden sm:inline">{{ view.label }}</span>
              </button>
            </nav>
          </div>

          <div class="welcome-more">
            <div class="min-h-0 overflow-hidden">
              <div class="relative space-y-1 px-5 pb-4 pt-1 sm:pl-[2.4rem]">
                <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300">Your trust, our standard</p>
                <p class="text-sm font-medium leading-relaxed text-white/80">{{ VIEW_INTROS[activeView] }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="registryUnavailable" class="mb-6 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-xs font-semibold text-warning-strong">
        This server has no module registry yet, so the built-in module list is shown.
      </div>
      <div v-else-if="registryFailed" class="mb-6 flex items-center justify-between gap-3 rounded-xl border border-error/40 bg-error-soft px-4 py-3 text-xs font-semibold text-error-strong">
        <span>Your modules could not be loaded: {{ moduleStore.registryError }}</span>
        <button class="rounded-lg border border-error/40 bg-white px-3 py-1 font-bold" @click="reload">Retry</button>
      </div>
      <LauncherSkeleton v-if="loadingModules && activeView !== 'reports'" :variant="activeView === 'products' ? 'products' : 'stats'" />

      <!-- Reports -->
      <template v-if="activeView === 'reports'">
        <div v-if="!visibleReports.length" class="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p class="text-sm font-bold text-ink">No reports for your role yet</p>
          <p class="mt-1 text-xs text-ink-subtle">Ask an administrator to give you a reporting role.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <button
            v-for="report in visibleReports"
            :key="report.id"
            type="button"
            class="group flex flex-col rounded-2xl border border-line bg-white p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            @click="openReport(report)"
          >
            <span class="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:h-6 [&>svg]:w-6" v-html="VIEWS[1].icon"></span>
            <h3 class="text-[0.98rem] font-extrabold leading-snug tracking-tight text-ink">{{ report.name }}</h3>
            <p class="mt-1.5 text-[0.8rem] font-medium leading-relaxed text-ink-subtle">{{ report.description }}</p>
            <span class="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              Open report
              <svg class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </button>
        </div>
      </template>

      <!-- Products -->
      <LauncherProducts
        v-if="activeView === 'products' && !loadingModules"
        class="launcher-fade"
        :modules="visibleModules"
        :title-of="tileTitle"
        :description-of="tileDescription"
      />

      <!-- Statistics -->
      <LauncherStats
        v-if="activeView === 'dashboard' && !loadingModules"
        class="launcher-fade"
        :modules="visibleModules"
        :title-of="tileTitle"
        @open-module="selectModule"
      />

    </main>
  </div>
</template>

<style scoped>
/* Clean Styling matching Proposal Form Builder screenshot */

/* The welcome bar opens downwards over the page, without moving it */
.welcome { transition: box-shadow 0.3s ease; }
.welcome:hover,
.welcome:focus-within { box-shadow: 0 18px 40px rgba(2, 20, 40, 0.28); }
.welcome-more {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
}
.welcome:hover .welcome-more,
.welcome:focus-within .welcome-more {
  grid-template-rows: 1fr;
  opacity: 1;
}
.welcome-hint { transition: transform 0.3s ease; }
.welcome:hover .welcome-hint,
.welcome:focus-within .welcome-hint { transform: rotate(180deg); }

@media (prefers-reduced-motion: reduce) {
  .welcome, .welcome-more, .welcome-hint { transition: none; }
}

/* Content eases in when it replaces the loading skeleton */
.launcher-fade {
  animation: launcher-fade 0.35s ease-out both;
}

@keyframes launcher-fade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .launcher-fade { animation: none; }
}
</style>