<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Drawer from "@/components/Drawer.vue";
import NavBar from "@/components/NavBar.vue";
import { useAuthStore } from "@/stores/auth";
import { useBreadcrumb } from "@/stores/breadCrumbsStore";
import navs from "@/config/navs";

const authStore = useAuthStore();
const breadcrumbs = useBreadcrumb();
const route = useRoute();

/* ---------- Responsive sidebar ---------- */
const COLLAPSE_KEY = "sidebar_collapsed";
const desktopQuery = window.matchMedia("(min-width: 1024px)");

const isDesktop = ref(desktopQuery.matches);
const mobileOpen = ref(false);
const collapsed = ref(readCollapsed());

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  try {
    localStorage.setItem(COLLAPSE_KEY, collapsed.value ? "1" : "0");
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

function onMediaChange(e) {
  isDesktop.value = e.matches;
  if (e.matches) mobileOpen.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape" && mobileOpen.value) mobileOpen.value = false;
}

onMounted(() => {
  desktopQuery.addEventListener("change", onMediaChange);
  document.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
  desktopQuery.removeEventListener("change", onMediaChange);
  document.removeEventListener("keydown", onKeydown);
});

// Close the mobile drawer after navigating
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  }
);

/* ---------- Navigation filtered by privileges ---------- */
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

  // Helper to check if user has a specific privilege
  const hasPrivilege = (privilege) => {
    if (userRole === "Super Admin" || effectivePrivileges.includes("All Privileges")) {
      return true;
    }
    return effectivePrivileges.includes(`ROLE_${privilege}`) || 
           effectivePrivileges.includes(privilege);
  };

  // Helper to check if user has ALL required privileges (AND logic)
  const hasAllPrivileges = (requiredPrivileges) => {
    if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
    if (userRole === "Super Admin" || effectivePrivileges.includes("All Privileges")) {
      return true;
    }
    return requiredPrivileges.every(priv => hasPrivilege(priv));
  };

  // Helper to check if user has ANY required privileges (OR logic)
  const hasAnyPrivilege = (requiredPrivileges) => {
    if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
    if (userRole === "Super Admin" || effectivePrivileges.includes("All Privileges")) {
      return true;
    }
    return requiredPrivileges.some(priv => hasPrivilege(priv));
  };

  // Helper to get required privileges from a nav item
  const getRequiredPrivileges = (navItem) => {
    if (navItem?.meta?.permissions && Array.isArray(navItem.meta.permissions)) {
      return navItem.meta.permissions;
    }
    if (Array.isArray(navItem?.privilege)) {
      return navItem.privilege;
    }
    return [];
  };

  // Check if user has Manages_Quotation privilege
  const hasManagesQuotation = hasPrivilege("Manages_Quotation");

  return navs
    .map((item) => {
      if (item.navs) {
        const isUnderwriting = item.name === "Underwriting";
        const isQuotationRelated = item.name === "Quotation" || item.name === "Quotation Underwriting";

        // For "Underwriting" section
        if (isUnderwriting) {
          if (hasManagesQuotation) {
            return null;
          }
          
          // Filter children using OR logic
          const filteredChildren = item.navs.filter((child) => {
            const childPrivs = getRequiredPrivileges(child);
            return hasAnyPrivilege(childPrivs);
          });
          
          if (filteredChildren.length === 0) {
            return null;
          }
          
          return {
            ...item,
            navs: filteredChildren
          };
        }

        // For "Quotation" and "Quotation Underwriting"
        if (isQuotationRelated) {
          if (!hasManagesQuotation) {
            return null;
          }
          
          // Filter children using AND logic
          const filteredChildren = item.navs.filter((child) => {
            const childPrivs = getRequiredPrivileges(child);
            return hasAllPrivileges(childPrivs);
          });
          
          if (filteredChildren.length === 0) {
            return null;
          }
          
          return {
            ...item,
            navs: filteredChildren
          };
        }

        // For any other sections
       // For any other sections
const parentPrivs = getRequiredPrivileges(item);
const hasParentAccess = hasAnyPrivilege(parentPrivs); // ← Changed to OR

const filteredChildren = item.navs.filter((child) => {
  const childPrivs = getRequiredPrivileges(child);
  return hasAllPrivileges(childPrivs);
});

if (filteredChildren.length === 0) {
  return null;
}

if (hasParentAccess) {
  return {
    ...item,
    navs: filteredChildren
  };
}

return null;
      } else {
        const requiredPrivs = getRequiredPrivileges(item);
        return hasAllPrivileges(requiredPrivs) ? item : null;
      }
    })
    .filter(Boolean);
});
</script>

<template>
  <div class="flex w-full h-full bg-canvas">
    <!-- Desktop sidebar -->
    <div
      v-if="isDesktop"
      class="h-full transition-[width] duration-200 ease-out shrink-0"
      :class="collapsed ? 'w-drawer-collapsed' : 'w-drawer-width'"
    >
      <Drawer :navs="filteredNavs" :collapsed="collapsed" @toggle-collapse="toggleCollapsed" />
    </div>

    <!-- Mobile / tablet drawer -->
    <template v-else>
      <Transition name="fade">
        <div
          v-if="mobileOpen"
          class="fixed inset-0 z-[200] bg-slate-900/40"
          aria-hidden="true"
          @click="mobileOpen = false"
        />
      </Transition>
      <Transition name="slide">
        <div
          v-if="mobileOpen"
          class="fixed inset-y-0 left-0 z-[201] w-[min(18rem,85vw)] shadow-pop"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <Drawer
            :navs="filteredNavs"
            mobile
            @navigate="mobileOpen = false"
            @close="mobileOpen = false"
          />
        </div>
      </Transition>
    </template>

    <!-- Main column -->
    <div class="flex flex-col flex-1 min-w-0 h-full">
      <NavBar
        :breadcrumbs="breadcrumbs"
        :show-menu-button="!isDesktop"
        @open-menu="mobileOpen = true"
      />

      <main id="main-content" class="overflow-auto relative flex-1 min-w-0 app-scroll">
        <div class="p-3 mx-auto w-full max-w-[1600px] sm:p-4 lg:p-6">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-scroll {
  scrollbar-gutter: stable;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 220ms var(--ease-out);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
