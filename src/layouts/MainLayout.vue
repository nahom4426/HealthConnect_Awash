<template>
  <div
    :class="colorStore.color"
    class="flex overflow-hidden w-screen h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20"
  >
    <!-- Mobile Drawer Toggle Button -->
    <button
      v-ripple
      @click="toggleDrawer"
      class="fixed top-3 left-3 z-30 p-3 text-white bg-gradient-to-r rounded-xl shadow-lg transition-all duration-300 lg:hidden w-fit h-fit from-primary to-secondary shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95"
      :aria-label="drawerOpen ? 'Close menu' : 'Open menu'"
    >
      <i
        v-html="drawerOpen ? icons.close : icons.menu"
        class="text-lg transition-transform duration-300"
        :class="{ 'rotate-90': drawerOpen }"
      ></i>
    </button>

    <!-- Mobile Overlay -->
    <div
      v-if="drawerOpen && !isDesktop"
      @click="toggleDrawer"
      class="fixed inset-0 z-10 backdrop-blur-sm transition-all duration-300 bg-black/50 lg:hidden"
    ></div>

    <!-- Sidebar Drawer -->
    <aside
      class="fixed top-0 z-20 h-full transition-all duration-500 ease-out lg:sticky"
      :class="[
        drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        isCollapsed ? 'lg:w-20' : 'lg:w-56 xl:w-60 2xl:w-64',
        'w-64'
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

    <!-- Main Content -->
    <main
      class="flex overflow-hidden relative z-0 flex-col flex-1 min-w-0 h-full"
    >
      <!-- Top Navbar -->
      <header class="flex-shrink-0">
        <NavBar :breadcrumbs="breadcrumbs" />
      </header>

      <!-- Page Content -->
      <div
        class="overflow-auto flex-1 p-3 min-h-0 sm:p-4 lg:p-6 xl:p-8 custom-scrollbar"
      >
        <div class="relative w-full min-w-0 h-full">
          <!-- Background Pattern -->
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none"
          ></div>
          
          <!-- Content Container -->
          <div class="relative w-full max-w-[1600px] mx-auto h-full">
            <RouterView v-slot="{ Component }">
              <Transition name="page" mode="out-in">
                <component :is="Component" :key="route.fullPath" />
              </Transition>
            </RouterView>
          </div>
        </div>
      </div>

      <!-- Scroll to Top Button -->
      <Transition name="fade">
        <button
          v-if="showScrollTop"
          @click="scrollToTop"
          class="fixed right-6 bottom-6 z-40 p-3 text-white bg-gradient-to-r rounded-full shadow-lg transition-all duration-300 from-primary to-secondary shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95"
          aria-label="Scroll to top"
        >
          <i v-html="icons.chevron_up" class="text-xl"></i>
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
/* Custom Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ensure proper box-sizing */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Prevent body scroll */
:global(body) {
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .custom-scrollbar {
    padding: 0.75rem;
  }
}

/* Print styles */
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