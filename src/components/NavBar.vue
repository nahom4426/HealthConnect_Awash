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
  <div
    class="flex sticky top-0 justify-between items-center px-4 h-16 border-b backdrop-blur-xl transition-all duration-300 sm:px-6 lg:h-20 bg-white/80 border-gray-200/50"
    :class="{
      'shadow-lg shadow-primary/5': isScrolled,
      'shadow-sm': !isScrolled
    }"
    style="z-index: 40;"
  > 
    <!-- Left Section -->
    <div class="flex gap-3 items-center sm:gap-4">
      <button 
        @click="$router.back()"
        class="p-2 rounded-xl transition-all duration-300 sm:p-2.5 hover:bg-primary/5 group active:scale-95"
        aria-label="Go back"
      >
        <i 
          v-html="icons.back" 
          class="text-lg text-gray-600 transition-all duration-300 transform group-hover:text-primary group-hover:-translate-x-0.5"
        />
      </button>

      <div class="flex flex-col min-w-0">
        <h1 class="text-lg font-bold text-gray-800 truncate sm:text-xl">
          {{ breadcrumbs.breadcrumbs.at(-1)?.name || "Health Connect" }}
        </h1>
        <p v-if="breadcrumbs.breadcrumbs.length > 1" class="hidden gap-1 items-center text-xs text-gray-500 sm:flex">
          <span v-for="(crumb, index) in breadcrumbs.breadcrumbs" :key="index">
            <span v-if="index > 0" class="text-primary/60">•</span>
            <span class="transition-colors cursor-pointer hover:text-primary truncate max-w-[100px]">{{ crumb.name }}</span>
          </span>
        </p>
      </div>
    </div>

    <!-- Center Section -->
    <div class="hidden lg:block">
      <div class="px-4 py-2 bg-gradient-to-r rounded-xl border shadow-inner backdrop-blur-sm from-primary/5 via-primary/10 to-secondary/5 border-primary/20">
        <span class="text-sm font-bold tracking-wide text-primary">
          {{ authStore.auth?.user?.companyName || 'Nyala Insurance' }}
        </span>
      </div>
    </div>

    <!-- Right Section -->
    <div class="flex relative gap-2 items-center sm:gap-3" style="z-index: 50;">
      
      <!-- Notification Bell -->
      <!-- <NotificationBell /> -->

      <!-- Language Selector -->
      <div class="relative">
        <Dropdown v-slot="{ setRef, toggleDropdown, open }">
          <button
            @click.prevent="toggleDropdown"
            class="flex gap-1 items-center px-3 py-2 rounded-xl transition-all duration-300 sm:gap-2 sm:px-4 hover:bg-primary/5 group active:scale-95"
            aria-haspopup="true"
          >
            <span class="text-sm font-semibold text-gray-700 group-hover:text-primary">ENG</span>
            <i 
              v-html="icons.chevron_down" 
              class="text-xs text-gray-500 transition-all duration-300 group-hover:text-primary"
              :class="{ 'rotate-180': open }"
            />
          </button>
          <div
            class="flex absolute top-full flex-col gap-1 p-2 mt-2 w-40 rounded-xl border shadow-xl backdrop-blur-md border-primary/20 bg-white/95 animate-dropdown"
            :ref="setRef"
            style="z-index: 60; right: 0;"
          >
            <button class="p-3 font-medium text-left rounded-lg transition-all duration-200 hover:bg-primary/5">English</button>
          </div>
        </Dropdown>
      </div>

      <!-- User Profile -->
      <div class="relative">
        <Dropdown v-slot="{ setRef, toggleDropdown, open }">
          <div
            @click.prevent="toggleDropdown"
            class="flex gap-2 items-center px-2 py-1.5 rounded-xl transition-all duration-300 cursor-pointer sm:gap-3 sm:px-3 sm:py-2 hover:bg-primary/5 group active:scale-95"
            role="button"
            tabindex="0"
          >
            <div class="relative flex-shrink-0">
              <div class="overflow-hidden w-8 h-8 rounded-full border-2 border-white shadow-lg sm:w-10 sm:h-10 shadow-primary/20">
                <img
                  :src="profilePicture"
                  alt="User avatar"
                  class="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                  @error="handleImageError"
                />
              </div>
              <span class="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
            </div>

            <div class="hidden flex-col items-start sm:flex">
              <span class="text-sm font-bold text-gray-800 max-w-[100px] truncate">
                {{ (authStore.auth?.user?.firstName || '') + ' ' + (authStore.auth?.user?.fatherName || '') || 'User' }}
              </span>
              <span class="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-gradient-to-r rounded-full border from-primary/10 to-secondary/10 text-primary border-primary/20 truncate max-w-[100px]">
                {{ authStore.auth?.user?.roleName || authStore.auth?.roleName || 'Admin' }}
              </span>
            </div>
            <i 
              v-html="icons.chevron_down" 
              class="text-xs text-gray-500 transition-all duration-300"
              :class="{ 'rotate-180': open }"
            />
          </div>

          <!-- Dropdown Menu -->
          <div
            class="flex absolute top-full flex-col gap-1 p-2 mt-2 w-56 rounded-xl border shadow-xl backdrop-blur-md sm:w-64 border-primary/20 bg-white/95 animate-dropdown"
            :ref="setRef"
            style="z-index: 60; right: 0;"
          >
            <div class="px-3 py-3 bg-gradient-to-r rounded-lg border-b border-primary/10 from-primary/5 to-secondary/5">
              <p class="text-sm font-bold text-gray-800 truncate">{{ authStore.auth?.user?.firstName }} {{ authStore.auth?.user?.fatherName }}</p>
              <p class="mt-1 text-xs text-gray-600 truncate">{{ authStore.auth?.user?.email }}</p>
            </div>

            <button @click="$router.push('/profile')" class="flex gap-3 items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/5 group">
              <i v-html="icons.profile" class="text-gray-500 transition-colors group-hover:text-primary" />
              <span class="text-sm font-medium">My Profile</span>
            </button>

            <button @click="$router.push('/settings')" class="flex gap-3 items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/5 group">
              <i v-html="icons.settings" class="text-gray-500 transition-colors group-hover:text-primary" />
              <span class="text-sm font-medium">Settings</span>
            </button>

            <div class="my-1 border-t border-primary/10"></div>

            <button
              @click="logout()"
              :disabled="isLoggingOut"
              class="flex gap-3 items-center p-3 text-red-500 rounded-xl transition-all duration-200 hover:bg-red-50 group"
              :class="isLoggingOut ? 'opacity-60 cursor-not-allowed' : ''"
            >
              <i v-html="icons.logout" class="transition-colors group-hover:text-red-600" />
              <span class="text-sm font-medium">{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
            </button>
          </div>
        </Dropdown>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes dropdown {
  from { 
    transform: translateY(-10px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

.animate-dropdown { 
  animation: dropdown 0.2s ease-out; 
}

/* Responsive dropdown positioning */
@media (max-width: 640px) {
  .animate-dropdown {
    position: fixed !important;
    right: 8px !important;
    left: 8px !important;
    width: auto !important;
    max-width: none !important;
    transform: translateY(0) !important;
  }
}
</style>