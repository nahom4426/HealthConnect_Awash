<script setup>
import icons from "@/utils/icons";
import { useAuthStore } from "@/stores/auth";
import { ref, computed, onMounted } from "vue";
import imageSrc from '@/assets/img/profile.png';
import Dropdown from "./new_form_elements/Dropdown.vue";
// import NotificationBell from "./notifications/Notifications.vue";

const authStore = useAuthStore();
const isScrolled = ref(false);
const isLoggingOut = ref(false);

const profilePicture = computed(() => {
  const data = authStore.auth?.user?.imageData || authStore.auth?.user?.image || null;
  if (!data) return imageSrc;
  if (typeof data === "string" && data.startsWith("data:image/")) return data;
  return `data:image/png;base64,${data}`;
});

onMounted(() => {
  const container = document.querySelector('.custom-scrollbar');
  if (container) {
    container.addEventListener('scroll', () => {
      isScrolled.value = container.scrollTop > 10;
    });
  }
});

function handleImageError(event) {
  event.target.src = imageSrc;
}

async function logout() {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}
 
const props = defineProps({
  breadcrumbs: Object,
});
</script>

<template>
  <nav
    class="flex sticky top-0 z-40 justify-between items-center px-4 h-14 border-b backdrop-blur-xl transition-all duration-200 sm:px-5 lg:px-6 bg-white/80 border-gray-200/60"
    :class="{ 'shadow-soft': isScrolled }"
    role="navigation"
    aria-label="Top navigation"
  >
    <!-- Left: Back + Breadcrumb -->
    <div class="flex gap-2 items-center min-w-0 sm:gap-3">
      <button
        @click="$router.back()"
        class="inline-flex justify-center items-center w-8 h-8 text-gray-500 rounded-lg transition-all duration-150 outline-none hover:bg-gray-100 hover:text-gray-700 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
        aria-label="Go back"
      >
        <i v-html="icons.back" class="text-base" />
      </button>

      <div class="hidden w-px h-5 bg-gray-200 sm:block" aria-hidden="true"></div>

      <div class="flex flex-col min-w-0">
        <h1 class="text-sm font-semibold leading-tight text-gray-900 truncate sm:text-base">
          {{ breadcrumbs.breadcrumbs.at(-1)?.name || "Health Connect" }}
        </h1>
        <nav v-if="breadcrumbs.breadcrumbs.length > 1" aria-label="Breadcrumb" class="hidden sm:block">
          <ol class="flex gap-1 items-center text-xs text-gray-400">
            <li v-for="(crumb, index) in breadcrumbs.breadcrumbs" :key="index" class="flex gap-1 items-center">
              <svg v-if="index > 0" class="flex-shrink-0 w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span
                class="truncate max-w-[90px] transition-colors hover:text-gray-600 cursor-default"
                :class="{ 'text-gray-600 font-medium': index === breadcrumbs.breadcrumbs.length - 1 }"
              >{{ crumb.name }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- Center: Company Badge -->
    <div class="hidden items-center lg:flex">
      <div class="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
        <span class="text-xs font-semibold tracking-wide text-gray-600">
          {{ authStore.auth?.user?.companyName || 'Nyala Insurance' }}
        </span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex gap-1 items-center sm:gap-1.5" style="z-index: 50;">

      <!-- Notification Bell -->
      <!-- <NotificationBell /> -->

      <!-- Language Selector -->
      <div class="relative">
        <Dropdown v-slot="{ setRef, toggleDropdown, open }">
          <button
            @click.prevent="toggleDropdown"
            class="inline-flex gap-1 items-center px-2.5 h-8 text-xs font-medium text-gray-600 rounded-lg transition-all duration-150 outline-none hover:bg-gray-100 hover:text-gray-800 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-haspopup="listbox"
            :aria-expanded="open"
          >
            <span>EN</span>
            <svg
              class="w-3 h-3 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': open }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            class="absolute right-0 top-full p-1 mt-1.5 w-36 bg-white rounded-lg border border-gray-200 shadow-elevated animate-scale-in"
            :ref="setRef"
            style="z-index: 60;"
            role="listbox"
          >
            <button class="px-3 py-2 w-full text-sm font-medium text-left text-gray-700 rounded-md transition-colors duration-100 hover:bg-gray-50" role="option" aria-selected="true">
              English
            </button>
          </div>
        </Dropdown>
      </div>

      <!-- Divider -->
      <div class="hidden w-px h-5 bg-gray-200 sm:block" aria-hidden="true"></div>

      <!-- User Profile -->
      <div class="relative">
        <Dropdown v-slot="{ setRef, toggleDropdown, open }">
          <button
            @click.prevent="toggleDropdown"
            class="flex items-center gap-2 px-1.5 py-1 rounded-lg transition-all duration-150 cursor-pointer sm:px-2 hover:bg-gray-100 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40 outline-none"
            :aria-expanded="open"
            aria-haspopup="menu"
          >
            <div class="relative flex-shrink-0">
              <div class="overflow-hidden w-7 h-7 rounded-full ring-2 ring-white shadow-xs sm:w-8 sm:h-8">
                <img
                  :src="profilePicture"
                  alt="User avatar"
                  class="object-cover w-full h-full"
                  @error="handleImageError"
                />
              </div>
              <span class="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" aria-label="Online"></span>
            </div>

            <div class="hidden flex-col items-start min-w-0 sm:flex">
              <span class="text-sm font-medium text-gray-800 truncate max-w-[100px] leading-tight">
                {{ (authStore.auth?.user?.firstName || '') + ' ' + (authStore.auth?.user?.fatherName || '') || 'User' }}
              </span>
              <span class="text-[10px] text-gray-400 font-medium truncate max-w-[100px] leading-tight">
                {{ authStore.auth?.user?.roleName || authStore.auth?.roleName || 'Admin' }}
              </span>
            </div>
            <svg
              class="hidden w-3 h-3 text-gray-400 transition-transform duration-200 sm:block"
              :class="{ 'rotate-180': open }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Profile Dropdown Menu -->
          <div
            class="overflow-hidden absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-elevated animate-scale-in"
            :ref="setRef"
            style="z-index: 60;"
            role="menu"
          >
            <!-- User Info Header -->
            <div class="px-3.5 py-3 bg-gray-50 border-b border-gray-100">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ authStore.auth?.user?.firstName }} {{ authStore.auth?.user?.fatherName }}</p>
              <p class="mt-0.5 text-xs text-gray-500 truncate">{{ authStore.auth?.user?.email }}</p>
            </div>

            <div class="p-1.5">
              <button @click="$router.push('/profile')" class="flex gap-2.5 items-center px-2.5 py-2 w-full text-sm text-gray-700 rounded-lg transition-colors duration-100 hover:bg-gray-50 group" role="menuitem">
                <i v-html="icons.profile" class="w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                <span class="font-medium">My Profile</span>
              </button>

              <button @click="$router.push('/settings')" class="flex gap-2.5 items-center px-2.5 py-2 w-full text-sm text-gray-700 rounded-lg transition-colors duration-100 hover:bg-gray-50 group" role="menuitem">
                <i v-html="icons.settings" class="w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                <span class="font-medium">Settings</span>
              </button>
            </div>

            <div class="border-t border-gray-100"></div>

            <div class="p-1.5">
              <button
                @click="logout()"
                :disabled="isLoggingOut"
                class="flex gap-2.5 items-center px-2.5 py-2 w-full text-sm rounded-lg transition-colors duration-100 hover:bg-red-50 group"
                :class="isLoggingOut ? 'opacity-50 cursor-not-allowed text-red-300' : 'text-red-600'"
                role="menuitem"
              >
                <i v-html="icons.logout" class="w-4 transition-colors" :class="isLoggingOut ? '' : 'group-hover:text-red-700'" />
                <span class="font-medium">{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.15s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 640px) {
  .animate-scale-in {
    position: fixed !important;
    right: 8px !important;
    left: 8px !important;
    width: auto !important;
    max-width: none !important;
  }
}
</style>