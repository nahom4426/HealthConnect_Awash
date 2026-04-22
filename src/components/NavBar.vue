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
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 10;
  });
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
    class="flex sticky top-0 justify-between items-center px-6 bg-gradient-to-r from-white via-white border-b backdrop-blur-xl transition-all duration-300 h-navbar-height to-blue-50/30 border-blue-100/50"
    :class="{
      'shadow-lg shadow-blue-500/10 bg-gradient-to-r from-white via-white to-blue-50/50': isScrolled,
      'shadow-sm': !isScrolled
    }"
    style="z-index: 100; position: relative;" 
  > 
    <!-- Left Section -->
    <div class="flex gap-6 items-center animate-fade-in">
      <button 
        @click="$router.back()"
        class="p-2.5 rounded-xl transition-all duration-300 hover:bg-primary/10 group hover:scale-105 hover:shadow-md hover:shadow-primary/20"
        aria-label="Go back"
      >
        <i 
          v-html="icons.back" 
          class="text-gray-600 transition-all duration-300 transform group-hover:text-primary group-hover:-translate-x-0.5"
        />
      </button>

      <div class="flex flex-col">
        <h1 class="text-xl font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-gray-800 animate-slide-in-left to-primary">
          {{ breadcrumbs.breadcrumbs.at(-1)?.name || "Health Connect" }}
        </h1>
        <p v-if="breadcrumbs.breadcrumbs.length > 1" class="flex gap-1 items-center text-xs text-gray-500 animate-fade-in">
          <span v-for="(crumb, index) in breadcrumbs.breadcrumbs" :key="index">
            <span v-if="index > 0" class="text-primary/60">•</span>
            <span class="transition-colors cursor-pointer hover:text-primary">{{ crumb.name }}</span>
          </span>
        </p>
      </div>
    </div>

    <!-- Center Section -->
    <div class="hidden md:block animate-zoom-in">
      <div class="px-6 py-3 bg-gradient-to-r rounded-2xl border shadow-inner backdrop-blur-sm from-primary/5 via-primary/10 to-secondary/5 border-primary/20">
        <span class="text-base font-bold tracking-wide text-primary">
          {{ authStore.auth?.user?.companyName || 'Nyala Insurance' }}
        </span>
      </div>
    </div>

    <!-- Right Section - CRITICAL: This wrapper creates the stacking context -->
    <div class="flex gap-3 items-center" style="position: relative; z-index: 1000; overflow: visible;">
      
      <!-- Notification Bell -->
      <!-- <NotificationBell /> -->

      <!-- Language Selector -->
      <div class="relative" style="z-index: 1001;">
        <Dropdown v-slot="{ setRef, toggleDropdown, open }">
          <button
            @click.prevent="toggleDropdown"
            class="flex gap-2 items-center px-4 py-2.5 rounded-xl transition-all duration-300 hover:bg-primary/10 group hover:scale-105 hover:shadow-md hover:shadow-primary/20"
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
            style="z-index: 10002; right: 0;"
          >
            <button class="p-3 font-medium text-left rounded-lg transition-all duration-200 hover:bg-primary/10">English</button>
          </div>
        </Dropdown>
      </div>

      <!-- User Profile -->
      <div class="relative" style="z-index: 1001;">
        <Dropdown v-slot="{ setRef, toggleDropdown, open }">
          <div
            @click.prevent="toggleDropdown"
            class="flex gap-3 items-center px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer hover:bg-primary/10 group hover:scale-105 hover:shadow-md hover:shadow-primary/20"
            role="button"
            tabindex="0"
          >
            <div class="relative">
              <div class="overflow-hidden w-10 h-10 rounded-full border-white shadow-lg border-3 shadow-primary/20">
                <img
                  :src="profilePicture"
                  alt="User avatar"
                  class="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                  @error="handleImageError"
                />
              </div>
              <span class="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
            </div>

            <div class="hidden flex-col items-start md:flex">
              <span class="text-sm font-bold text-gray-800 max-w-[120px] line-clamp-1">
                {{ (authStore.auth?.user?.firstName || '') + ' ' + (authStore.auth?.user?.fatherName || '') || 'User' }}
              </span>
              <span class="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r rounded-full border from-primary/10 to-secondary/10 text-primary border-primary/20">
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
            class="flex absolute top-full flex-col gap-1 p-2 mt-2 w-48 rounded-xl border shadow-xl backdrop-blur-md border-primary/20 bg-white/95 animate-dropdown"
            :ref="setRef"
            style="z-index: 10002; right: 0;"
          >
            <div class="px-3 py-3 bg-gradient-to-r rounded-lg border-b border-primary/10 from-primary/5 to-secondary/5">
              <p class="text-sm font-bold text-gray-800">{{ authStore.auth?.user?.firstName }} {{ authStore.auth?.user?.fatherName }}</p>
              <p class="mt-1 text-xs text-gray-600">{{ authStore.auth?.user?.email }}</p>
            </div>

            <button @click="$router.push('/profile')" class="flex gap-3 items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/10 group">
              <i v-html="icons.profile" class="text-gray-500 transition-colors group-hover:text-primary" />
              <span class="text-sm font-medium">My Profile</span>
            </button>

            <button @click="$router.push('/settings')" class="flex gap-3 items-center p-3 rounded-xl transition-all duration-200 hover:bg-primary/10 group">
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
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-left {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes zoom-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes dropdown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fade-in { animation: fade-in 0.4s ease-out; }
.animate-slide-in-left { animation: slide-in-left 0.4s ease-out; }
.animate-zoom-in { animation: zoom-in 0.3s ease-out; }
.animate-dropdown { animation: dropdown 0.2s ease-out; }

/* Ensure dropdowns appear above all other content */
:deep(.dropdown) {
  position: relative;
  z-index: 1001 !important;
}

:deep(.dropdown > *) {
  position: relative;
  z-index: 10002 !important;
}

/* Prevent dropdown overflow */
.animate-dropdown {
  max-width: calc(100vw - 16px);
  box-sizing: border-box;
}

/* Responsive dropdown positioning */
@media (max-width: 768px) {
  .animate-dropdown {
    right: 8px !important;
    left: auto !important;
    transform: translateX(0) !important;
    width: calc(100vw - 32px) !important;
    max-width: 320px !important;
    min-width: 200px !important;
  }
}

@media (max-width: 480px) {
  .animate-dropdown {
    right: 4px !important;
    width: calc(100vw - 24px) !important;
    max-width: 280px !important;
  }
}
</style>