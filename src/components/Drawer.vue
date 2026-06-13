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
  <nav
    class="flex relative flex-col w-full h-full bg-gradient-to-b via-white to-white backdrop-blur-sm transition-all duration-500 ease-out group from-slate-50/95"
    :class="{ 'items-center': isCollapsed }"
    aria-label="Sidebar navigation"
  >
    <!-- Animated gradient border - top to bottom glow effect -->
    <div class="overflow-hidden absolute inset-0 rounded-2xl pointer-events-none">
      <div class="absolute inset-0 bg-gradient-to-b via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100 from-primary/5"></div>
    </div>

    <!-- Header / Logo Section -->
    <div class="relative px-4 pt-8 pb-6">
      <!-- Logo container with dynamic scaling and glass effect -->
      <div
        class="relative mx-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
        :class="isCollapsed ? 'w-12' : 'w-44'"
      >
        <!-- Animated gradient ring -->
        <div
          class="absolute -inset-1 bg-gradient-to-br to-transparent rounded-2xl opacity-0 transition-all duration-500 from-primary/20 via-primary/5"
          :class="{ 'opacity-100 scale-105': !isCollapsed, 'opacity-0': isCollapsed }"
        ></div>
        
        <!-- Logo with smooth scale on hover -->
        <div class="relative transition-transform duration-300 transform hover:scale-105">
          <img
            class="w-full h-auto rounded-xl ring-1 shadow-lg shadow-primary/5 ring-primary/10"
            src="/src/assets/img/logoD.png"
            alt="Nyala Insurance Logo"
          />
        </div>
      </div>

      <!-- Brand identity - animated slide in -->
      <Transition name="brand">
        <div v-if="!isCollapsed" class="mt-4 text-center">
         
          <div class="flex gap-2 justify-center items-center mt-1.5">
            <span class="w-4 h-px bg-gradient-to-r from-transparent to-primary/40"></span>
            <p class="text-[11px] font-semibold tracking-[0.2em] text-primary/80 uppercase">Health Connect</p>
            <span class="w-4 h-px bg-gradient-to-l from-transparent to-primary/40"></span>
          </div>
        </div>
      </Transition>

      <!-- Collapse Toggle Button (Expanded State) -->
      <Transition name="fade">
        <button
          v-if="!isCollapsed"
          @click="toggleSidebar"
          class="flex absolute -right-3 top-12 z-20 justify-center items-center w-6 h-6 bg-white rounded-full border shadow-md transition-all duration-300 cursor-pointer border-slate-200 text-slate-400 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-primary/10"
          aria-label="Collapse sidebar"
        >
          <svg class="w-3 h-3 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </Transition>
    </div>

    <!-- Elegant divider -->
    <div class="mx-5 mb-4">
      <div class="h-px bg-gradient-to-r from-transparent to-transparent via-slate-200"></div>
    </div>

    <!-- Scrollable Navigation Area -->
    <div class="overflow-y-auto overflow-x-hidden flex-1 px-3 pb-6 nav-scrollbar">
      <div class="flex flex-col gap-1">
        <DrawerButtonParent
          v-for="nav in navs"
          :key="nav.name"
          :navs="nav"
          :is-collapsed="isCollapsed"
          class="transition-all duration-200"
        />
      </div>
    </div>

    <!-- Expand Toggle Button (Collapsed State) -->
    <Transition name="fade">
      <div v-if="isCollapsed" class="flex justify-center pb-6">
        <button
          @click="toggleSidebar"
          class="flex justify-center items-center w-8 h-8 rounded-xl transition-all duration-300 text-slate-400 hover:bg-primary/10 hover:text-primary hover:shadow-sm"
          aria-label="Expand sidebar"
        >
          <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Modern Footer -->
    <div class="relative px-4 py-4 mt-auto bg-gradient-to-b from-transparent border-t border-slate-100/80 to-slate-50/50">
      <Transition name="brand">
        <div v-if="!isCollapsed" class="flex gap-3 items-center">
          <div class="relative">
            <div class="w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/30"></div>
            <div class="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full opacity-75 animate-ping"></div>
          </div>
          <div class="flex-1">
            <p class="text-[11px] font-medium text-slate-500">© 2026 Nyala Insurance</p>
            <p class="text-[10px] font-medium text-primary/60">We Flow with You</p>
          </div>
        </div>
      </Transition>
      
      <!-- Collapsed footer indicator -->
      <div v-if="isCollapsed" class="flex justify-center">
        <div class="flex justify-center items-center w-6 h-6 rounded-lg bg-primary/5">
          <span class="text-[10px] font-bold text-primary">NI</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Modern scrollbar styling */
.nav-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.nav-scrollbar:hover {
  scrollbar-color: #94a3b8 transparent;
}

.nav-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.nav-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.nav-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 20px;
}

.nav-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #cbd5e1;
}

.nav-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Smooth brand transitions */
.brand-enter-active,
.brand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.brand-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Subtle hover lift effect for nav items container */
.nav-item-wrapper {
  transition: transform 0.2s ease;
}

.nav-item-wrapper:hover {
  transform: translateX(2px);
}
</style>