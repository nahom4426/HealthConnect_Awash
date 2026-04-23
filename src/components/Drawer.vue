<script setup>
import DrawerButtonParent from "@/components/drawer_buttons/DrawerButtonParent.vue";
import icons from "@/utils/icons";

defineProps({
  navs: { type: Array, default: () => [] },
  isCollapsed: { type: Boolean, default: false },
  toggleSidebar: { type: Function, default: () => {} },
});
</script>

<template>
  <div 
    class="flex relative flex-col h-full bg-white border-r shadow-xl transition-all duration-300 border-primary/10"
    :class="{ 'items-center': isCollapsed }"
  >
    <!-- Header Section -->
    <div class="flex relative z-10 items-center p-4 pb-2">
      <div class="flex flex-col gap-2 items-center w-full">
        <img 
          :class="isCollapsed ? 'h-12 w-12' : 'h-20'"
          class="transition-all duration-300 object-contain" 
          src="/src/assets/img/logoD.png"
          alt="Logo"
        />
        <Transition name="fade">
          <p v-if="!isCollapsed" class="text-xs font-medium text-center text-gray-600">
            Health Connect
          </p>
        </Transition>
      </div>
      
      <!-- Collapse Toggle Button -->
      <button
        v-if="!isCollapsed"
        @click="toggleSidebar"
        class="absolute -right-3 top-8 p-1.5 bg-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-110 border border-gray-200"
        aria-label="Collapse sidebar"
      >
        <i v-html="icons.chevron_left" class="text-sm text-gray-600"></i>
      </button>
    </div>

    <!-- Divider -->
    <div class="relative z-10 mx-4 mb-4">
      <div class="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
    </div>
    
    <!-- Navigation Menu -->
    <div class="overflow-y-auto overflow-x-hidden relative z-10 flex-1 px-2 pb-4 show-scrollbar">
      <div class="flex flex-col gap-1">
        <DrawerButtonParent 
          :navs="nav" 
          v-for="nav in navs" 
          :key="nav.name"
          :is-collapsed="isCollapsed"
        />
      </div>
    </div>

    <!-- Expand Toggle Button (when collapsed) -->
    <button
      v-if="isCollapsed"
      @click="toggleSidebar"
      class="mb-4 p-2 bg-white rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-110 border border-gray-200"
      aria-label="Expand sidebar"
    >
      <i v-html="icons.chevron_right" class="text-sm text-gray-600"></i>
    </button>

    <!-- Footer Section -->
    <div class="relative z-10 p-4 border-t border-gray-100">
      <div :class="isCollapsed ? 'text-center' : ''">
        <Transition name="fade">
          <p v-if="!isCollapsed" class="text-xs font-medium text-gray-500">
            © 2026 Nyala Insurance
          </p>
        </Transition>
        <Transition name="fade">
          <p v-if="!isCollapsed" class="mt-1 text-xs text-gray-400">
            We Flow with You
          </p>
        </Transition>
        <p v-if="isCollapsed" class="text-xs font-bold text-primary">Nyala</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.show-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.show-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.show-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.show-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>