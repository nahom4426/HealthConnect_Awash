<script setup>
import Drawer from "@/components/Drawer.vue";
import NavBar from "@/components/NavBar.vue";
import { useAuthStore } from "@/stores/auth";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import { useColorStore } from "@/stores/colorStore";
import icons from "@/utils/icons";
import navs from "@/config/navs";

import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const authStore = useAuthStore();
const breadcrumbs = useBreadcrumb();
const colorStore = useColorStore();
const route = useRoute();
const router = useRouter();

const drawerOpen = ref(false);
const isDesktop = ref(false);
const expandedMenus = ref([]);

// Responsive drawer logic
function checkScreenSize() {
  isDesktop.value = window.innerWidth >= 768;
  if (!isDesktop.value) {
    drawerOpen.value = false;
  }
}

onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  // expand active menu on load
  filteredNavs.value.forEach((item) => {
    if (item.navs?.some((child) => child.path === route.path)) {
      expandedMenus.value.push(item.name);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
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

<template>
  <div
    :class="colorStore.color"
    class="flex w-full h-full bg-gradient-to-br from-gray-50 via-white to-blue-50/20"
  >
    <!-- Mobile Drawer Toggle Button -->
    <div
      v-ripple
      @click="toggleDrawer"
      class="fixed top-3 left-3 z-30 p-2.5 text-white bg-gradient-to-r rounded-lg shadow-lg transition-all duration-300 md:hidden w-fit h-fit from-primary to-secondary shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95"
    >
      <i
        v-html="drawerOpen ? icons.close : icons.menu"
        class="text-lg transition-transform duration-300"
        :class="{ 'rotate-90': drawerOpen }"
      ></i>
    </div>

    <!-- Mobile Overlay -->
    <div
      v-if="drawerOpen && !isDesktop"
      @click="toggleDrawer"
      class="fixed inset-0 z-10 backdrop-blur-sm transition-all duration-300 bg-black/50"
    ></div>

    <!-- Sidebar Drawer -->
    <div
      class="fixed z-20 h-full transition-all duration-500 ease-out __drawer md:static"
      :class="[
        drawerOpen ? 'translate-x-0 ' : '-translate-x-full md:translate-x-0',
        'w-drawer-width',
      ]"
    >
      <Drawer
        :is-collapsed="false"
        :toggle-sidebar="() => {}"
        :navs="filteredNavs"
        :expanded-menus="expandedMenus"
        :toggle-menu="toggleMenu"
      />
    </div>

    <!-- Main Content -->
    <div
      :class="[
        drawerOpen ? 'md:w-[calc(100%-var(--drawer-width))]' : 'md:w-full',
      ]"
      class="flex relative z-0 flex-col min-w-0 transition-all duration-500 ease-out"
    >
      <!-- Top Navbar with Breadcrumbs -->
      <div
        class="h-navbar-height flex flex-col relative z-[100]"
        style="z-index: 100;"
      >
        <NavBar :breadcrumbs="breadcrumbs" />
      </div>

      <!-- Page Content -->
      <div
        class="overflow-x-scroll overflow-y-scroll custom-scrollbar min-w-0 h-[calc(100%-var(--navbar-height))] py-2 md:p-4 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30 flex-1 relative z-0"
      >
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_50%)] z-0"
        ></div>

        <div class="relative z-0 min-w-max h-full">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Customize drawer width and navbar height if needed */
:root {
  --drawer-width: 18rem;
  --navbar-height: 4rem;
}

.custom-scrollbar {
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

:deep(.custom-scrollbar::-webkit-scrollbar) {
  height: 12px;
  width: 12px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  background: #e5e7eb;
  border-radius: 6px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background: #6b7280;
  border-radius: 6px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
  background: #4b5563;
}

.__drawer {
  backdrop-filter: blur(10px);
}

* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
