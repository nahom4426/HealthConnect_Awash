<script setup>
import DrawerButtonParent from "@/components/drawer_buttons/DrawerButtonParent.vue";

defineProps({
  navs: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="flex relative flex-col h-full bg-[#F8FEFF] border-l-4 border-primary shadow-xl">
    <!-- Header Section -->
    <div class="flex relative z-10 items-center p-6 pb-4">
       <div class="flex flex-col gap-4 items-center w-full">
      <img class="h-30" src="/src/assets/img/logo.png" />

      </div>
    </div>

    <!-- Divider -->
    <div class="relative z-10 mx-6 mb-6">
      <div class="h-px bg-gray-100"></div>
    </div>
    
    <!-- Navigation Menu -->
    <div class="overflow-y-auto relative z-10 flex-1 px-4 pb-6 show-scrollbar">
      <div class="flex flex-col gap-1">
        <DrawerButtonParent :navs="nav" v-for="nav in navs" :key="nav.name" />
      </div>
    </div>

    <!-- Footer Section -->
    <div class="relative z-10 p-6 pt-4 border-t border-gray-100">
      <div class="text-center">
        <p class="text-xs font-medium text-gray-500">
          © 2026 Awash Insurance
        </p>
        <p class="mt-1 text-xs text-gray-400">
          We Flow with You
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional subtle scrollbar styling */
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
</style>