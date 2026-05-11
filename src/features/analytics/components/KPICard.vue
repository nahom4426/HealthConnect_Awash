<script setup lang="ts">
defineProps({
  title: String,
  value: String,
  change: String,
  trend: String, // 'up' or 'down'
  icon: String,
});
</script>

<template>
  <div class="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 overflow-hidden">
    <!-- Gradient background accent -->
    <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
    
    <!-- Content -->
    <div class="relative z-10">
      <!-- Header with icon -->
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ title }}</p>
          <h3 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{{ value }}</h3>
        </div>
        <div class="text-4xl opacity-80 group-hover:opacity-100 transition-opacity">{{ icon }}</div>
      </div>

      <!-- Change indicator -->
      <div class="flex items-center gap-2 pt-2">
        <span 
          :class="[
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all',
            trend === 'up' 
              ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700' 
              : 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700'
          ]"
        >
          <svg 
            v-if="trend === 'up'"
            class="w-3.5 h-3.5 mr-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414-1.414L13.586 7H12z" clip-rule="evenodd" />
          </svg>
          <svg 
            v-else
            class="w-3.5 h-3.5 mr-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v3.586l4.293-4.293a1 1 0 011.414 1.414L9.414 13H12z" clip-rule="evenodd" />
          </svg>
          {{ change }}
        </span>
        <span class="text-xs text-gray-400 font-medium">vs last period</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
