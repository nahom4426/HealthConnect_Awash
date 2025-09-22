<script setup>
import icons from "@/utils/icons";
// import Dropdown from "./Dropdown.vue";
import { useAuthStore } from "@/stores/auth";
import { ref, computed, onMounted } from "vue";
import imageSrc from '@/assets/img/profile.png';
import Dropdown from "./new_form_elements/Dropdown.vue";

const authStore = useAuthStore();
const isScrolled = ref(false);
const profilePicture = ref(authStore.auth?.user?.imageData || null);

async function processProfilePicture() {
  if (profilePicture.value && !profilePicture.value.startsWith("data:image/")) {
    profilePicture.value = `data:image/png;base64,${authStore.auth?.user?.imageData}`;
  }
}

onMounted(() => {
  processProfilePicture();
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 10;
  });
});

function handleImageError() {
  profilePicture.value = imageSrc;
}

function logout() {
  authStore.logout(); // Uses the centralized logout logic
}
 
const props = defineProps({
  breadcrumbs: Object,
});
</script>

<template>
  <div
    class="h-navbar-height bg-white/80 backdrop-blur-md bg-red-500 flex items-center sticky top-0 z-50 justify-between px-6 transition-all duration-300 shadow-sm"
    :class="{
      'shadow-lg scale-[1.005]': isScrolled,
      'border-b border-gray-100': !isScrolled
    }"
  > 
    <!-- Left Section -->
    <div class="flex items-center  gap-6 animate-fade-in">
      <button 
        @click="$router.back()"
        class="p-2 rounded-full hover:bg-primary/10 transition-colors duration-200 group hover:scale-105"
        aria-label="Go back"
      >
        <i 
          v-html="icons.back" 
          class="text-gray-600 group-hover:text-primary transition-colors duration-200"
        />
      </button>

      <div class="flex flex-col">
        <h1 class="text-lg font-semibold text-gray-800 animate-slide-in-left">
          {{ breadcrumbs.breadcrumbs.at(-1)?.name || "Health Connect" }}
        </h1>
        <p v-if="breadcrumbs.breadcrumbs.length > 1" class="text-xs text-gray-500 flex items-center gap-1 animate-fade-in">
          <span v-for="(crumb, index) in breadcrumbs.breadcrumbs" :key="index">
            <span v-if="index > 0">/</span>
            <span class="hover:text-primary transition-colors">{{ crumb.name }}</span>
          </span>
        </p>
      </div>
    </div>

    <!-- Center Section -->
    <div class="hidden md:block animate-zoom-in">
      <div class="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-lg shadow-inner border border-white/50">
        <span class="text-primary font-medium text-sm md:text-base animate-pulse">
          {{ authStore.auth?.user?.companyName || 'Super Admin' }}
        </span>
      </div>
    </div>

    <!-- Right Section -->
    <div class="flex items-center gap-4">
      <!-- Language Selector -->
      <Dropdown v-slot="{ setRef, toggleDropdown }">
        <button
          @click.prevent="toggleDropdown"
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group hover:scale-105"
        >
          <span class="text-sm font-medium text-gray-700 group-hover:text-primary">ENG</span>
          <i 
            v-html="icons.chevron_down" 
            class="text-xs text-gray-500 group-hover:text-primary group-hover:rotate-180 transition-transform"
          />
        </button>
        <div
          class="absolute shadow-lg border p-2 mt-2 rounded-lg flex flex-col gap-1 w-40 bg-white/95 backdrop-blur-sm animate-dropdown"
          :ref="setRef"
        >
          <button class="p-2 text-left hover:bg-gray-50 rounded-md transition-colors">English</button>
          <!-- <button class="p-2 text-left hover:bg-gray-50 rounded-md transition-colors">Amharic</button> -->
        </div>
      </Dropdown>

      <!-- User Profile -->
      <Dropdown v-slot="{ setRef, toggleDropdown }">
        <div
          @click.prevent="toggleDropdown"
          class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer group hover:scale-105"
        >
          <div class="relative">
            <div class="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow">
              <img
                :src="profilePicture || imageSrc"
                alt="User avatar"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                @error="handleImageError"
              />
            </div>
            <span class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>

          <div class="hidden md:flex flex-col items-start">
            <span class="text-sm font-semibold text-gray-800 max-w-[120px] line-clamp-1">
              {{ authStore.auth.firstName + ' ' + authStore.auth.fatherName || 'User' }}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
              {{ authStore.auth.roleName || 'Admin' }}
            </span>
          </div>
          <i v-html="icons.chevron_down" class="text-xs text-gray-500 group-hover:rotate-180 transition-transform" />
        </div>

        <!-- Dropdown Menu -->
        <div
          class="absolute right-0 shadow-xl border border-gray-100 p-2 mt-2 rounded-xl flex flex-col gap-1 w-56 bg-white/95 backdrop-blur-sm z-50 animate-dropdown"
          :ref="setRef"
        >
          <div class="px-3 py-2 border-b border-gray-100">
            <p class="text-sm font-medium text-gray-800">{{ authStore.auth.firstName }} {{ authStore.auth.fatherName }}</p>
            <p class="text-xs text-gray-500">{{ authStore.auth.email }}</p>
          </div>

          <button @click="$router.push('/profile')" class="p-2 flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <i v-html="icons.profile" class="text-gray-500 group-hover:text-primary" />
            <span class="text-sm">My Profile</span>
          </button>

          <button @click="$router.push('/settings')" class="p-2 flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <i v-html="icons.settings" class="text-gray-500 group-hover:text-primary" />
            <span class="text-sm">Settings</span>
          </button>

          <div class="border-t border-gray-100 my-1"></div>

          <button @click="logout()" class="p-2 flex items-center gap-3 rounded-lg hover:bg-red-50 text-red-500 transition-all duration-200">
            <i v-html="icons.logout" class="group-hover:text-red-600" />
            <span class="text-sm">Logout</span>
          </button>
        </div>
      </Dropdown>
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
</style>
