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
  const privileges = authStore.user?.authorities || [];
  const userRole = authStore.user?.roleName;

  const hasAccess = (path, requiredPrivileges) => {
    if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
    if (userRole === "Super Admin" || privileges.includes("All Privileges")) return true;
    if (privileges.length === 0) return false;

    return requiredPrivileges.some((priv) =>
      privileges.includes(`ROLE_${priv}`)
    );
  };

  return navs
    .map((item) => {
      if (item.navs) {
        const filteredChildren = item.navs.filter((child) =>
          hasAccess(child.path, child.privilege)
        );
        if (filteredChildren.length) {
          return {
            ...item,
            navs: filteredChildren,
          };
        }
        return null;
      } else {
        return hasAccess(item.path, item.privilege) ? item : null;
      }
    })
    .filter(Boolean);
});
</script>

<template>
  <div :class="colorStore.color" class="flex h-full w-full">
    <!-- Mobile Drawer Toggle Button -->
    <div
      v-ripple
      @click="toggleDrawer"
      class="md:hidden fixed w-fit h-fit z-30 top-4 left-4 bg-primary text-white rounded p-3 shadow-lg"
    >
      <i v-html="drawerOpen ? icons.close : icons.menu"></i>
    </div>

    <!-- Sidebar Drawer -->
    <div
      class="__drawer fixed md:static z-20 h-full transition-all duration-300 ease-in-out"
      :class="[
        drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
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
      class="flex flex-col"
    >
      <!-- Top Navbar with Breadcrumbs -->
      <div class="h-navbar-height flex flex-col ">
       
        
       <NavBar :breadcrumbs="breadcrumbs" />
      </div>

      <!-- Page Content -->
      <div
        class="overflow-y-auto h-[calc(100%-var(--navbar-height))] !p-2 bg-base-clr2 flex-1"
      >
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Customize drawer width and navbar height if needed */
:root {
  --drawer-width: 16rem;
  --navbar-height: 4rem;
}
</style>
