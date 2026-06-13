<template>
  <div
    :class="colorStore.color"
    class="flex overflow-hidden w-screen h-screen bg-gray-50"
  >
    <!-- Mobile Drawer Toggle -->
    <button
      @click="toggleDrawer"
      class="fixed top-3 left-3 z-30 inline-flex items-center justify-center w-10 h-10 text-white bg-primary rounded-lg shadow-medium transition-all duration-200 lg:hidden hover:bg-primary/90 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-none"
      :aria-label="drawerOpen ? 'Close menu' : 'Open menu'"
      :aria-expanded="drawerOpen"
    >
      <i
        v-html="drawerOpen ? icons.close : icons.menu"
        class="text-base transition-transform duration-200"
        :class="{ 'rotate-90': drawerOpen }"
      ></i>
    </button>

    <!-- Mobile Overlay -->
    <Transition name="overlay">
      <div
        v-if="drawerOpen && !isDesktop"
        @click="toggleDrawer"
        class="fixed inset-0 z-10 bg-gray-900/30 backdrop-blur-sm lg:hidden"
        aria-hidden="true"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed top-0 z-20 h-full transition-all duration-300 ease-smooth lg:sticky lg:flex-shrink-0"
      :class="[
        drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
        'w-[260px]'
      ]"
    >
      <Drawer
        :is-collapsed="isCollapsed"
        :toggle-sidebar="toggleCollapse"
        :navs="filteredNavs"
        :expanded-menus="expandedMenus"
        :toggle-menu="toggleMenu"
      />
    </aside>

    <!-- Main Content Area -->
    <main class="flex overflow-hidden relative z-0 flex-col flex-1 min-w-0 h-full">
      <!-- Navbar -->
      <header class="flex-shrink-0">
        <NavBar :breadcrumbs="breadcrumbs" />
      </header>

      <!-- Page Content -->
      <div class="overflow-auto flex-1 min-h-0 custom-scrollbar">
        <div class="p-4 sm:p-5 lg:p-6">
          <div class="w-full max-w-[1440px] mx-auto">
            <RouterView v-slot="{ Component }">
              <Transition name="page" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
              </Transition>
            </RouterView>
          </div>
        </div>
      </div>

      <!-- Scroll to Top -->
      <Transition name="fade">
        <button
          v-if="showScrollTop"
          @click="scrollToTop"
          class="fixed right-5 bottom-5 z-40 inline-flex items-center justify-center w-9 h-9 text-gray-600 bg-white rounded-lg shadow-medium border border-gray-200 transition-all duration-200 hover:shadow-elevated hover:text-gray-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40 outline-none"
          aria-label="Scroll to top"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import Drawer from "@/components/Drawer.vue";
import NavBar from "@/components/NavBar.vue";
import { useAuthStore } from "@/stores/auth";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useColorStore } from "@/stores/colorStore";
import icons from "@/utils/icons";
import navs from "@/config/navs";

import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const breadcrumbs = useBreadcrumb();
const colorStore = useColorStore();
const route = useRoute();
const router = useRouter();

const drawerOpen = ref(false);
const isDesktop = ref(false);
const isCollapsed = ref(false);
const expandedMenus = ref([]);
const showScrollTop = ref(false);
const contentContainer = ref(null);

// Responsive drawer logic
function checkScreenSize() {
  const width = window.innerWidth;
  isDesktop.value = width >= 1024;
  
  if (isDesktop.value) {
    drawerOpen.value = true;
    // Auto-collapse on medium screens
    isCollapsed.value = width < 1280;
  } else {
    drawerOpen.value = false;
    isCollapsed.value = false;
  }
}

// Handle scroll events
function handleScroll(event) {
  const target = event.target;
  showScrollTop.value = target.scrollTop > 300;
}

function scrollToTop() {
  const container = document.querySelector('.custom-scrollbar');
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function toggleCollapse() {
  if (isDesktop.value) {
    isCollapsed.value = !isCollapsed.value;
  }
}

onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);
  
  // Add scroll listener to content container
  const container = document.querySelector('.custom-scrollbar');
  if (container) {
    container.addEventListener('scroll', handleScroll);
  }

  // expand active menu on load
  filteredNavs.value.forEach((item) => {
    if (item.navs?.some((child) => child.path === route.path)) {
      expandedMenus.value.push(item.name);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
  const container = document.querySelector('.custom-scrollbar');
  if (container) {
    container.removeEventListener('scroll', handleScroll);
  }
});

// Watch for route changes
watch(() => route.path, () => {
  if (!isDesktop.value) {
    drawerOpen.value = false;
  }
});

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

function toggleMenu(name) {
  if (expandedMenus.value.includes(name)) {
    expandedMenus.value = expandedMenus.value.filter((n) => n !== name);
  } else {
    expandedMenus.value.push(name);
  }
}

// Filter navs based on privileges
const filteredNavs = computed(() => {
  const user = authStore.auth?.user;
  const roleName = user?.roleName;
  const privileges = Array.isArray(user?.privileges) ? user.privileges : [];
  const authorities = Array.isArray(authStore.user?.authorities)
    ? authStore.user.authorities
    : [];
  const effectivePrivileges = [...privileges, ...authorities]
    .filter(Boolean)
    .map((p) => String(p).trim());
  const userRole = roleName;
  const hasManagesQuotation =
    userRole === "Super Admin" ||
    effectivePrivileges.includes("All Privileges") ||
    effectivePrivileges.includes("ROLE_Manages_Quotation") ||
    effectivePrivileges.includes("Manages_Quotation");

  const hasAccess = (path, requiredPrivileges) => {
    if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
    if (
      userRole === "Super Admin" ||
      effectivePrivileges.includes("All Privileges")
    )
      return true;
    if (effectivePrivileges.length === 0) return false;

    return requiredPrivileges.some((priv) =>
      effectivePrivileges.includes(`ROLE_${priv}`)
    );
  };

  const getRequiredPrivileges = (navItem) => {
    if (navItem?.meta && Array.isArray(navItem.meta.permissions)) {
      return navItem.meta.permissions;
    }
    if (Array.isArray(navItem?.privilege)) {
      return navItem.privilege;
    }
    return [];
  };

  return navs
    .map((item) => {
      if (hasManagesQuotation && item?.name === "Underwriting") {
        return null;
      }
      if (!hasManagesQuotation && item?.name === "Quotation Underwriting") {
        return null;
      }
      if (item.navs) {
        const filteredChildren = item.navs.filter((child) =>
          hasAccess(child.path, getRequiredPrivileges(child))
        );
        if (!hasAccess(item.path, getRequiredPrivileges(item))) {
          return null;
        }
        if (filteredChildren.length) {
          return {
            ...item,
            navs: filteredChildren,
          };
        }
        return null;
      } else {
        return hasAccess(item.path, getRequiredPrivileges(item)) ? item : null;
      }
    })
    .filter(Boolean);
});
</script>

<style scoped>
/* Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

/* Page Transition */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Overlay */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Prevent body scroll */
:global(body) {
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Print */
@media print {
  aside, header, .fixed {
    display: none !important;
  }
  main {
    margin: 0 !important;
    padding: 0 !important;
  }
}
</style>